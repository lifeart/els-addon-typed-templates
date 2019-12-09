"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
const path = require("path");
const fs = require("fs");
const utils_1 = require("./utils");
const services = {};
const components = new WeakMap();
function componentsForService(service, clean = false) {
    if (clean) {
        components.set(service, {});
    }
    return components.get(service);
}
exports.componentsForService = componentsForService;
function serviceForRoot(uri) {
    if (!services[uri]) {
        const registry = ts.createDocumentRegistry(false, uri);
        let tsConfig = {};
        if (fs.existsSync(path.join(uri, "tsconfig.json"))) {
            try {
                tsConfig = JSON.parse(fs.readFileSync(path.join(uri, "tsconfig.json"), "utf8"));
                if (tsConfig && tsConfig.compilerOptions) {
                    tsConfig = tsConfig.compilerOptions;
                }
            }
            catch (e) {
                //
            }
        }
        // console.log('tsConfig', tsConfig);
        const host = {
            getCompilationSettings() {
                return Object.assign({}, tsConfig, {
                    baseUrl: ".",
                    allowJs: true,
                    allowSyntheticDefaultImports: true,
                    skipLibCheck: true,
                    noImplicitAny: false,
                    moduleResolution: ts.ModuleResolutionKind.NodeJs,
                    strictPropertyInitialization: false,
                    module: ts.ModuleKind.ES2015
                });
            },
            getScriptFileNames() {
                let els = [
                    ...Object.keys(componentsForService(services[uri]))
                ];
                // console.log('els', els);
                let walkParams = {
                    directories: true,
                    globs: ["**/*.{js,ts,d.ts}"]
                };
                let appEntry = path.join(uri, "app");
                let addonEntry = path.join(uri, "addon");
                let typesEntry = path.join(uri, "types");
                let commonTypes = path.join(__dirname, './../../../src/lib/common-types.d.ts');
                let projectTypes = utils_1.safeWalkSync(path.join(uri, "types"), walkParams).map(el => path.resolve(path.join(typesEntry, el)));
                let projectAppFiles = utils_1.safeWalkSync(path.join(uri, "app"), walkParams).map(el => path.resolve(path.join(appEntry, el)));
                let projectAddonFiles = utils_1.safeWalkSync(path.join(uri, "addon"), walkParams).map(el => path.resolve(path.join(addonEntry, el)));
                return [
                    ...Array.from(new Set([
                        commonTypes,
                        ...els,
                        ...projectAppFiles,
                        ...projectAddonFiles,
                        ...projectTypes
                    ]))
                ];
            },
            getScriptVersion(_fileName) {
                // if (fs.existsSync(_fileName)) {
                //   let stats = fs.statSync(_fileName);
                //   return stats.mtime.getTime().toString();
                // }
                return "";
            },
            getScriptSnapshot(fileName) {
                const maybeVirtualFile = componentsForService(services[uri])[path.resolve(fileName)];
                if (maybeVirtualFile) {
                    return ts.ScriptSnapshot.fromString(maybeVirtualFile);
                }
                else {
                    let name = path.basename(fileName, path.extname(fileName));
                    if (fs.existsSync(fileName)) {
                        return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString());
                    }
                    else {
                        let libName = "lib." + name.toLowerCase() + ".d.ts";
                        let libFileNmae = path.join(path.dirname(fileName), libName);
                        if (fs.existsSync(libFileNmae)) {
                            return ts.ScriptSnapshot.fromString(fs.readFileSync(libFileNmae).toString());
                        }
                    }
                    // console.log("getScriptSnapshot:unknownFileName", fileName);
                    return ts.ScriptSnapshot.fromString("");
                }
            },
            getCurrentDirectory: () => {
                return path.resolve(uri);
            },
            getDefaultLibFileName(opts) {
                return path.resolve(ts.getDefaultLibFilePath(opts));
            }
        };
        services[uri] = ts.createLanguageService(host, registry);
        components.set(services[uri], {});
    }
    return services[uri];
}
exports.serviceForRoot = serviceForRoot;
//# sourceMappingURL=ts-service.js.map