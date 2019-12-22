import * as ts from "typescript";
import * as path from "path";
import * as fs from "fs";
import { safeWalkSync } from "./utils";

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

interface ProjectMirror {
  project: {
    files: Map<string, ProjectFile>;
  };
  files: WeakMap<ProjectFile, TSMeta>;
}

const STABLE_FILES: Map<string, TSMeta> = new Map();
const PROJECTS_MAP: Map<string, ProjectMirror> = new Map();

export function registerProject(item) {
  PROJECTS_MAP.set(item.root.split(":").pop(), {
    project: item,
    files: new WeakMap()
  });
}

export function serviceForRoot(uri): ts.LanguageService {
  if (!services[uri]) {
    const registry: ts.DocumentRegistry = ts.createDocumentRegistry(false, uri);
    const project = PROJECTS_MAP.get(uri) as ProjectMirror;
    let tsConfig: any = {};
    if (fs.existsSync(path.join(uri, "tsconfig.json"))) {
      try {
        tsConfig = JSON.parse(
          fs.readFileSync(path.join(uri, "tsconfig.json"), "utf8")
        );
        if (tsConfig && tsConfig.compilerOptions) {
          tsConfig = tsConfig.compilerOptions;
        }
      } catch (e) {
        //
      }
    }
    function initialProjectFileStructure() {
      let walkParams = {
        directories: true,
        globs: ["**/*.{js,ts,d.ts}"]
      };
      let appEntry = path.join(uri, "app");
      let addonEntry = path.join(uri, "addon");
      let typesEntry = path.join(uri, "types");
      let commonTypes = path.join(
        __dirname,
        "./../../../src/lib/common-types.d.ts"
      );
      let projectTypes = safeWalkSync(
        path.join(uri, "types"),
        walkParams
      ).map(el => path.resolve(path.join(typesEntry, el)));
      let projectAppFiles = safeWalkSync(
        path.join(uri, "app"),
        walkParams
      ).map(el => path.resolve(path.join(appEntry, el)));
      let projectAddonFiles = safeWalkSync(
        path.join(uri, "addon"),
        walkParams
      ).map(el => path.resolve(path.join(addonEntry, el)));

      return Array.from(
        new Set([
          commonTypes,
          ...projectTypes,
          ...projectAppFiles,
          ...projectAddonFiles
        ])
      ) as string[];
    }
    const initialFiles = initialProjectFileStructure();
    // console.log('tsConfig', tsConfig);
    const host: ts.LanguageServiceHost = {
      getCompilationSettings() {
        return Object.assign({}, tsConfig, {
          baseUrl: ".",
          allowJs: true,
          allowSyntheticDefaultImports: true,
          skipLibCheck: true,
          experimentalDecorators: true,
          noImplicitAny: false,
          moduleResolution: ts.ModuleResolutionKind.NodeJs,
          strictPropertyInitialization: false,
          module: ts.ModuleKind.ES2015
        });
      },
      getScriptFileNames() {
        let els = [...Object.keys(componentsForService(services[uri]))];
        return Array.from(
          new Set([...initialFiles, ...els, ...project.project.files.keys()])
        );
      },
      getScriptVersion(fileName: string) {
        const _fileName = path.resolve(fileName);
        if (project.project.files.has(_fileName)) {
          // return Date.now().toString();
          return project.project.files.get(_fileName)!.version.toString();
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
      },
      getScriptSnapshot(rawFileName) {
        const maybeVirtualFile = componentsForService(services[uri])[
          path.resolve(rawFileName)
        ];
        if (maybeVirtualFile) {
          // if file is virtual (constructed template) -> return fresh snapshot
          return ts.ScriptSnapshot.fromString(maybeVirtualFile);
        } else {
          let fileName = path.resolve(path.normalize(rawFileName));
          // console.log(fileName);
          // console.log(project.project.files);
          // if project has changed files
          // console.log('project.project.files', project.project.files);
          // console.log('has file?' , project.project.files.has(fileName));
          if (project.project.files.has(fileName)) {
            // project changed file
            let mirror = project.project.files.get(fileName) as ProjectFile;
            // ts mirrors
            if (!project.files.has(mirror)) {
              project.files.set(mirror, {
                version: -1,
                snapshot: ts.ScriptSnapshot.fromString("")
              });
            }
            if (project.files.has(mirror)) {
              let tsMeta = project.files.get(mirror);
              // if no ts-mirror - we must create it;
              if (!tsMeta) {
                tsMeta = {
                  version: -1,
                  snapshot: ts.ScriptSnapshot.fromString("")
                };
                project.files.set(mirror, tsMeta);
              }
              if (tsMeta.version !== mirror.version) {
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
