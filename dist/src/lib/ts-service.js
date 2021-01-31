"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceForRoot = exports.typeForPath = exports.matchPathToType = exports.serverForProject = exports.registerProject = exports.componentsForService = void 0;
const ts = require("typescript");
const path = require("path");
const fs = require("fs");
const utils_1 = require("./utils");
const logger_1 = require("./logger");
const services = {};
const components = new WeakMap();
function componentsForService(service, clean = false) {
    if (clean) {
        components.set(service, {});
    }
    return components.get(service);
}
exports.componentsForService = componentsForService;
const STABLE_FILES = new Map();
const PROJECTS_MAP = new Map();
function registerProject(item, server) {
    PROJECTS_MAP.set(item.root, {
        project: item,
        server: server,
        files: new WeakMap()
    });
}
exports.registerProject = registerProject;
const serverMock = {
    getRegistry(_) {
        return {
            'transform': {},
            'helper': {},
            'component': {},
            'routePath': {},
            'model': {},
            'service': {},
            'modifier': {}
        };
    }
};
function serverForProject(root) {
    const projectMirror = PROJECTS_MAP.get(root);
    if (!projectMirror) {
        logger_1.withDebug(() => {
            console.log('server-mock used');
        });
        return serverMock;
    }
    return projectMirror.server;
}
exports.serverForProject = serverForProject;
function matchPathToType(project, uri) {
    let result = project.matchPathToType(uri);
    if (result === null) {
        return null;
    }
    result.className = utils_1.normalizeToAngleBracketName(result.name) + result.type.charAt(0).toUpperCase() + result.type.slice(1);
    result.className = result.className.split('-').join('_');
    return result;
}
exports.matchPathToType = matchPathToType;
function typeForPath(root, uri) {
    logger_1.withDebug(() => {
        console.log('typeForPath', root, uri);
    });
    const projectMirror = PROJECTS_MAP.get(root);
    return matchPathToType(projectMirror.project, uri);
}
exports.typeForPath = typeForPath;
function getProjectTypeScriptConfig(root) {
    let tsConfig = {};
    if (fs.existsSync(path.join(root, "tsconfig.json"))) {
        try {
            tsConfig = JSON.parse(fs.readFileSync(path.join(root, "tsconfig.json"), "utf8"));
            if (tsConfig && tsConfig.compilerOptions) {
                tsConfig = tsConfig.compilerOptions;
            }
        }
        catch (e) {
            //
        }
    }
    return tsConfig;
}
class TypescriptService {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        const uri = projectRoot;
        const registry = ts.createDocumentRegistry(false, uri);
        this.registry = registry;
        this.project = PROJECTS_MAP.get(uri);
        this.tsConfig = getProjectTypeScriptConfig(projectRoot);
        this.initialFiles = this.initialProjectFileStructure();
        this.ts = ts.createLanguageService(this, registry);
    }
    getProjectFilesFromFolder(entry) {
        const walkParams = {
            directories: true,
            globs: ["**/*.{js,ts,d.ts}"]
        };
        let projectEntry = path.join(this.projectRoot, entry);
        return utils_1.safeWalkSync(path.join(this.projectRoot, entry), walkParams).map(el => path.resolve(path.join(projectEntry, el)));
    }
    initialProjectFileStructure() {
        let commonTypes = path.join(__dirname, "./../../../src/lib/common-types.d.ts");
        let projectTypes = this.getProjectFilesFromFolder("types");
        let projectAppFiles = this.getProjectFilesFromFolder("app");
        let projectAddonFiles = this.getProjectFilesFromFolder("addon");
        return Array.from(new Set([
            commonTypes,
            ...projectTypes,
            ...projectAppFiles,
            ...projectAddonFiles
        ]));
    }
    getDefaultLibFileName(opts) {
        return path.resolve(ts.getDefaultLibFilePath(opts));
    }
    getCompilationSettings() {
        return Object.assign({}, this.tsConfig, {
            baseUrl: ".",
            allowJs: true,
            checkJs: true,
            allowSyntheticDefaultImports: true,
            skipLibCheck: true,
            experimentalDecorators: true,
            noImplicitAny: false,
            moduleResolution: ts.ModuleResolutionKind.NodeJs,
            strictPropertyInitialization: false,
            module: ts.ModuleKind.ES2015
        });
    }
    getScriptFileNames() {
        let els = [...Object.keys(componentsForService(services[this.projectRoot]))];
        return Array.from(new Set([...this.initialFiles, ...els, ...this.project.project.files.keys()]));
    }
    getScriptVersion(fileName) {
        const _fileName = path.resolve(fileName);
        const projectFiles = this.project.project.files;
        if (projectFiles.has(_fileName)) {
            // return Date.now().toString();
            return projectFiles.get(_fileName).version.toString();
        }
        if (STABLE_FILES.has(_fileName)) {
            // return Date.now().toString();
            return STABLE_FILES.get(_fileName).version.toString();
        }
        if (fs.existsSync(_fileName)) {
            let stats = fs.statSync(_fileName);
            return stats.mtime.getTime().toString();
        }
        return Date.now().toString();
    }
    getScriptSnapshot(rawFileName) {
        const maybeVirtualFile = componentsForService(services[this.projectRoot])[path.resolve(rawFileName)];
        if (maybeVirtualFile) {
            // if file is virtual (constructed template) -> return fresh snapshot
            return ts.ScriptSnapshot.fromString(maybeVirtualFile);
        }
        else {
            let fileName = path.resolve(path.normalize(rawFileName));
            const originalProjectFiles = this.project.project.files;
            const tsProjectFiles = this.project.files;
            // console.log(fileName);
            // console.log(project.project.files);
            // if project has changed files
            // console.log('project.project.files', project.project.files);
            // console.log('has file?' , project.project.files.has(fileName));
            if (originalProjectFiles.has(fileName)) {
                // project changed file
                let mirror = originalProjectFiles.get(fileName);
                // ts mirrors
                if (!tsProjectFiles.has(mirror)) {
                    tsProjectFiles.set(mirror, {
                        version: -1,
                        snapshot: ts.ScriptSnapshot.fromString("")
                    });
                }
                if (tsProjectFiles.has(mirror)) {
                    let tsMeta = tsProjectFiles.get(mirror);
                    // if no ts-mirror - we must create it;
                    if (!tsMeta) {
                        tsMeta = {
                            version: -1,
                            snapshot: ts.ScriptSnapshot.fromString("")
                        };
                        tsProjectFiles.set(mirror, tsMeta);
                    }
                    if (tsMeta.version !== mirror.version) {
                        if (!fs.existsSync(fileName)) {
                            // @to-do - figure out why remove event don't touch it
                            console.log(`typed-template: unable to get file ${fileName}, fix watcher`);
                            tsProjectFiles.delete(mirror);
                            originalProjectFiles.delete(fileName);
                            return ts.ScriptSnapshot.fromString("");
                        }
                        // if versions different - we need to update file
                        tsMeta.snapshot = ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString());
                        if (STABLE_FILES.has(fileName)) {
                            const stableItem = STABLE_FILES.get(fileName);
                            stableItem.snapshot = tsMeta.snapshot;
                            stableItem.version = tsMeta.version;
                        }
                    }
                    return tsMeta.snapshot;
                }
            }
            else {
                // if file is not marked as changed, we count it as stable
                if (!STABLE_FILES.has(fileName) && fs.existsSync(fileName)) {
                    // if no stable record, but file exists - we must create it.
                    let text = fs.readFileSync(fileName).toString();
                    STABLE_FILES.set(fileName, {
                        version: 0,
                        snapshot: ts.ScriptSnapshot.fromString(text)
                    });
                }
                if (STABLE_FILES.has(fileName)) {
                    return STABLE_FILES.get(fileName).snapshot;
                }
                // file not exists
                let name = path.basename(fileName, path.extname(fileName));
                let libName = "lib." + name.toLowerCase() + ".d.ts";
                let libFileNmae = path.join(path.dirname(fileName), libName);
                if (fs.existsSync(libFileNmae)) {
                    return ts.ScriptSnapshot.fromString(fs.readFileSync(libFileNmae).toString());
                }
                return ts.ScriptSnapshot.fromString("");
            }
        }
    }
    getCurrentDirectory() {
        return this.projectRoot;
    }
}
exports.default = TypescriptService;
function serviceForRoot(uri) {
    if (!services[uri]) {
        services[uri] = new TypescriptService(uri).ts;
        components.set(services[uri], {});
    }
    return services[uri];
}
exports.serviceForRoot = serviceForRoot;
//# sourceMappingURL=ts-service.js.map