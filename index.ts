import { URI } from "vscode-uri";
import * as ts from "typescript";
import * as path from "path";
import * as fs from "fs";

const services: any = {};

function serviceForRoot(uri): ts.LanguageService {
  if (!services[uri]) {
    const registry: ts.DocumentRegistry = ts.createDocumentRegistry(false, uri);
    const host: ts.LanguageServiceHost = {
      getCompilationSettings() {
        return {};
      },
      getScriptFileNames() {
        console.log("getScriptFileNames");
        return ["ts-test.ts", "application.ts", "component.ts"].map(name =>
          path.join("c:", uri, name)
        );
      },
      getScriptVersion(_fileName) {
        return "";
      },
      getScriptSnapshot(fileName) {
        console.log("getScriptSnapshot", fileName);
        if (fileName.endsWith("application.ts")) {
          return ts.ScriptSnapshot.fromString([
            'import Component from "./component";',
            "export default class Template extends Component {",
            "_template_pathExpresion() {",
            "return this.",
            "}",
            "}"
          ].join(''));
        } else
          return ts.ScriptSnapshot.fromString(
            fs.readFileSync(fileName).toString()
          );
      },
      getCurrentDirectory: () => uri,
      getDefaultLibFileName(opts) {
        return ts.getDefaultLibFilePath(opts);
      }
    };
    services[uri] = ts.createLanguageService(host, registry);
  }

  return services[uri];
}

export async function onComplete(root, { results, type, textDocument }) {
  // if (type !== "script") {
  //   return results;
  // }

  const projectRoot = URI.parse(root).fsPath;
  const service = serviceForRoot(projectRoot);
  try {
    results = service.getCompletionsAtPosition(
      URI.parse(textDocument.uri)
        .fsPath.split("\\")
        .join("/").replace('.hbs','.ts'),
      124,
      { includeInsertTextCompletions: true }
    );
    return results.entries.filter(({name})=>!name.startsWith('_t')).map((el)=>{
      console.log('el',el);
      return {
        label: 'this.' + el.name
      };
    })
  } catch (e) {
    // console.error(e, e.ProgramFiles);
  }
  console.log("results", results);
  return results;
}
