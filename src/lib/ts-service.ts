import * as ts from "typescript";
import * as path from "path";
import * as fs from "fs";
import { safeWalkSync, normalizeToAngleBracketName } from "./utils";

const services: any = {};
const components = new WeakMap();

export function componentsForService(service, clean = false) {
  if (clean) {
    components.set(service, {});
  }
  return components.get(service);
}

type ProjectFile = { version: number };
type TSMeta = { version: number; snapshot: ts.IScriptSnapshot };
type MatchResultType =
  | 'helper'
  | 'service'
  | 'route'
  | 'controller'
  | 'modifier'
  | 'template'
  | 'component'
  | 'model'
  | 'transform'
  | 'adapter'
  | 'serializer';

// {"type":"component","name":"my-component","kind":"template","scope":"application","className":"MyComponentComponent"}
export interface MatchResult {
  type: MatchResultType;
  name: string;
  kind: string;
  scope: string;
  className?: string;
}

interface RegistryItem {
  [key: string]: string[]
}

interface LSRegistry {
  'transform': RegistryItem;
  'helper': RegistryItem;
  'component': RegistryItem;
  'routePath': RegistryItem;
  'model': RegistryItem;
  'service': RegistryItem;
  'modifier': RegistryItem;
}
export interface LanguageServer {
  getRegistry(root: string): LSRegistry
}
interface ProjectMirror {
  project: {
    files: Map<string, ProjectFile>;
    matchPathToType(filePath: string): null | MatchResult
  };
  server: LanguageServer,
  files: WeakMap<ProjectFile, TSMeta>;
}

const STABLE_FILES: Map<string, TSMeta> = new Map();
const PROJECTS_MAP: Map<string, ProjectMirror> = new Map();

export function registerProject(item, server) {
  PROJECTS_MAP.set(item.root, {
    project: item,
    server: server,
    files: new WeakMap()
  });
}



const serverMock: LanguageServer = {
  getRegistry(_: string): LSRegistry {
    return {
      'transform': {},
      'helper': {},
      'component': {},
      'routePath': {},
      'model': {},
      'service': {},
      'modifier': {}
    }
  }
}

export function serverForProject(root: string) {
  const projectMirror = PROJECTS_MAP.get(root) as ProjectMirror;
  if (!projectMirror) {
    console.log('server-mock used');
    return serverMock as LanguageServer;
  }
  return projectMirror.server;
}

export function typeForPath(root: string, uri: string) {
  console.log('typeForPath', root,  uri);
  const projectMirror = PROJECTS_MAP.get(root) as ProjectMirror;
  let result = projectMirror.project.matchPathToType(uri);
  if (result === null) {
    return null;
  }
  result.className = normalizeToAngleBracketName(result.name) + result.type.charAt(0).toUpperCase() + result.type.slice(1);
  return result;
}

function getProjectTypeScriptConfig(root: string) {
  let tsConfig: any = {};
  if (fs.existsSync(path.join(root, "tsconfig.json"))) {
    try {
      tsConfig = JSON.parse(
        fs.readFileSync(path.join(root, "tsconfig.json"), "utf8")
      );
      if (tsConfig && tsConfig.compilerOptions) {
        tsConfig = tsConfig.compilerOptions;
      }
    } catch (e) {
      //
    }
  }
  return tsConfig;
}

export default class TypescriptService implements ts.LanguageServiceHost {
  ts!: ts.LanguageService;
  registry!: ts.DocumentRegistry;
  tsConfig!: {};
  projectRoot!: string;
  project !: ProjectMirror;
  initialFiles: any;
  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    const uri = projectRoot;
    const registry: ts.DocumentRegistry = ts.createDocumentRegistry(false, uri);
    this.registry = registry;
    this.project = PROJECTS_MAP.get(uri) as ProjectMirror;
    this.tsConfig = getProjectTypeScriptConfig(projectRoot);
    this.initialFiles = this.initialProjectFileStructure();
    this.ts = ts.createLanguageService(this, registry);
  }
  private getProjectFilesFromFolder(entry: string) {
    const walkParams = {
      directories: true,
      globs: ["**/*.{js,ts,d.ts}"]
    };
    let projectEntry = path.join(this.projectRoot, entry);
    return safeWalkSync(
      path.join(this.projectRoot, entry),
      walkParams
    ).map(el => path.resolve(path.join(projectEntry, el)));
  }
  private initialProjectFileStructure() {
    let commonTypes = path.join(
      __dirname,
      "./../../../src/lib/common-types.d.ts"
    );
    let projectTypes = this.getProjectFilesFromFolder("types");
    let projectAppFiles = this.getProjectFilesFromFolder("app");
    let projectAddonFiles = this.getProjectFilesFromFolder("addon");

    return Array.from(
      new Set([
        commonTypes,
        ...projectTypes,
        ...projectAppFiles,
        ...projectAddonFiles
      ])
    ) as string[];
  }
  getDefaultLibFileName(opts: ts.CompilerOptions) {
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
    return Array.from(
      new Set([...this.initialFiles, ...els, ...this.project.project.files.keys()])
    );
  }
  getScriptVersion(fileName: string) {
    const _fileName = path.resolve(fileName);
    const projectFiles = this.project.project.files;
    if (projectFiles.has(_fileName)) {
      // return Date.now().toString();
      return projectFiles.get(_fileName)!.version.toString();
    }
    if (STABLE_FILES.has(_fileName)) {
      // return Date.now().toString();
      return STABLE_FILES.get(_fileName)!.version.toString();
    }
    if (fs.existsSync(_fileName)) {
      let stats = fs.statSync(_fileName);
      return stats.mtime.getTime().toString();
    }
    return Date.now().toString();
  }
  getScriptSnapshot(rawFileName) {
    const maybeVirtualFile = componentsForService(services[this.projectRoot])[
      path.resolve(rawFileName)
    ];
    if (maybeVirtualFile) {
      // if file is virtual (constructed template) -> return fresh snapshot
      return ts.ScriptSnapshot.fromString(maybeVirtualFile);
    } else {
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
        let mirror = originalProjectFiles.get(fileName) as ProjectFile;
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
            tsMeta.snapshot = ts.ScriptSnapshot.fromString(
              fs.readFileSync(fileName).toString()
            );
            if (STABLE_FILES.has(fileName)) {
              const stableItem = STABLE_FILES.get(fileName) as TSMeta;
              stableItem.snapshot = tsMeta.snapshot;
              stableItem.version = tsMeta.version;
            }
          }
          return tsMeta.snapshot;
        }
      } else {
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
          return (STABLE_FILES.get(fileName) as TSMeta).snapshot;
        }

        // file not exists
        let name = path.basename(fileName, path.extname(fileName));
        let libName = "lib." + name.toLowerCase() + ".d.ts";
        let libFileNmae = path.join(path.dirname(fileName), libName);
        if (fs.existsSync(libFileNmae)) {
          return ts.ScriptSnapshot.fromString(
            fs.readFileSync(libFileNmae).toString()
          );
        }
        return ts.ScriptSnapshot.fromString("");
      }
    }
  }
  getCurrentDirectory() {
    return this.projectRoot;
  }
}

export function serviceForRoot(uri): ts.LanguageService {
  if (!services[uri]) {
    services[uri] = new TypescriptService(uri).ts;
    components.set(services[uri], {});
  }

  return services[uri];
}
