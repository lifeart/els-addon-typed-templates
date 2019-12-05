import { URI } from "vscode-uri";
import * as ts from "typescript";
import * as path from "path";
import * as fs from "fs";

const services: any = {};

const PLACEHOLDER = "ELSCompletionDummy";

function getBasicComponent(pathExp = PLACEHOLDER) {
  return [
    'import Component from "./component";',
    "export default class Template extends Component {",
    "_template_PathExpresion() {",
    "return " + pathExp,
    "}",
    "}"
  ].join('')
}

function serviceForRoot(uri): ts.LanguageService {
  if (!services[uri]) {
    const registry: ts.DocumentRegistry = ts.createDocumentRegistry(false, uri);
    const host: ts.LanguageServiceHost = {
      getCompilationSettings() {
        return {};
      },
      getScriptFileNames() {
        let els = ["ts-test.ts", "component.ts", ...Object.keys(componentsMap).map((el)=>path.basename(el))].map(name =>
          path.resolve(path.join(uri, name))
        );
        return els;
      },
      getScriptVersion(_fileName) {
        return "";
      },
      getScriptSnapshot(fileName) {
        const maybeVirtualFile = componentsMap[path.resolve(fileName)];
        if (maybeVirtualFile) {
          return ts.ScriptSnapshot.fromString(maybeVirtualFile);
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

const componentsMap = {};

export async function onComplete(root, { results, focusPath, type, textDocument }) {
  if (type !== "template") {
    return results;
  }
  if (focusPath.node.type !== 'PathExpression') {
    return results;
  }

  const projectRoot = URI.parse(root).fsPath;
  const service = serviceForRoot(projectRoot);
  try {
    let fileName = path.resolve(URI.parse(textDocument.uri)
    .fsPath).replace('.hbs','.ts');

    let realPath = focusPath.sourceForNode().replace(PLACEHOLDER, '');
    componentsMap[fileName] = getBasicComponent(realPath);
    let pos = getBasicComponent().indexOf(PLACEHOLDER) + realPath.length;

    results = service.getCompletionsAtPosition(
      fileName,
      pos,
      { includeInsertTextCompletions: true }
    );
    return results.entries.filter(({name})=>!name.startsWith('_t')).map((el)=>{
      // console.log(el);
      return {
        label: realPath + el.name
      };
    })
  } catch (e) {
    // console.error(e, e.ProgramFiles);
  }
  return results;
}
