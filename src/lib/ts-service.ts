
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

export function serviceForRoot(uri): ts.LanguageService {
  if (!services[uri]) {
    const registry: ts.DocumentRegistry = ts.createDocumentRegistry(false, uri);
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
    // console.log('tsConfig', tsConfig);
    const host: ts.LanguageServiceHost = {
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
        return [
          ...Array.from(
            new Set([
              commonTypes,
              ...els,
              ...projectAppFiles,
              ...projectAddonFiles,
              ...projectTypes
            ])
          )
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
        } else {
          let name = path.basename(fileName, path.extname(fileName));
          if (fs.existsSync(fileName)) {
            return ts.ScriptSnapshot.fromString(
              fs.readFileSync(fileName).toString()
            );
          } else {
            let libName = "lib." + name.toLowerCase() + ".d.ts";
            let libFileNmae = path.join(path.dirname(fileName), libName);
            if (fs.existsSync(libFileNmae)) {
              return ts.ScriptSnapshot.fromString(
                fs.readFileSync(libFileNmae).toString()
              );
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