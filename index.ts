import { URI } from "vscode-uri";
import { Location, Range, Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';
import * as ts from "typescript";
import * as path from "path";
import * as fs from "fs";

const services: any = {};
const PLACEHOLDER = "ELSCompletionDummy";

function getBasicComponent(pathExp = PLACEHOLDER) {
  return [
    'import Component from "./component";',
    "export default class Template extends Component {",
    "_template_PathExpresion(): string | number | void {",
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
        return {
          "baseUrl": ".",
          "allowJs": true,
          "allowSyntheticDefaultImports": true,
          "skipLibCheck": true,
          "moduleResolution": ts.ModuleResolutionKind.NodeJs,
          "module": ts.ModuleKind.ES2015,
        };
      },
      getScriptFileNames() {
        let els = ["component.ts", ...Object.keys(componentsMap).map((el)=>path.basename(el))].map(name =>
          path.resolve(path.join(uri, name))
        );
        return [...els];
      },
      getScriptVersion(_fileName) {
        return "";
      },
      getScriptSnapshot(fileName) {
        const maybeVirtualFile = componentsMap[path.resolve(fileName)];
        if (maybeVirtualFile) {
          return ts.ScriptSnapshot.fromString(maybeVirtualFile);
        } else {
          return ts.ScriptSnapshot.fromString(
            fs.readFileSync(fileName).toString()
          );
        }


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

function offsetToRange(start, limit, source) {
  let rLines = /(.*?(?:\r\n?|\n|$))/gm;
  let startLine = source.slice(0, start).match(rLines) || [];
  let line = startLine.length - 2;
  let col = startLine[ startLine.length - 2].length;
  let endLine = source.slice(start, limit).match(rLines) || [];
  let endCol = col;
  let endLineNumber = line;
  if (endLine.length === 1) {
    endCol = col + limit;
    endLineNumber = line + endLine.length - 1;
  } else {
    endCol = endLine[endLine.length - 1].length;
  }
  return Range.create(line, col, endLineNumber, endCol);
}

function tsDefinitionToLocation(el) {
  let scope = el.textSpan;
  let file = fs.readFileSync(el.fileName, 'utf8');
  return Location.create(URI.file(el.fileName).toString(), offsetToRange(scope.start, scope.length, file));
}

export async function onDefinition(root, { results, focusPath, type, textDocument }) {
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
    results = service.getDefinitionAtPosition(fileName, pos);
    return results.filter(({name})=>!name.startsWith('_t')).map((el)=>{
      return  tsDefinitionToLocation(el);
    })
  } catch (e) {
    console.error(e, e.ProgramFiles);
  }
  return results;
}

export function toDiagnostic(err, [startIndex, endIndex], focusPath): Diagnostic {
  if (err.start>=startIndex && (err.length + err.start ) <= endIndex) {
    let loc = focusPath.node.loc;
    return {
      severity: DiagnosticSeverity.Error,
      range:  loc ? Range.create(loc.start.line - 1, loc.start.column, loc.end.line - 1, loc.end.column) : Range.create(0, 0, 0, 0),
      message: err.messageText,
      source: 'typed-templates'
    };
  } else return {
    severity: DiagnosticSeverity.Error,
    range: offsetToRange(0, 0, ''),
    message: err.messageText,
    source: 'typed-templates'
  };
}

export async function onComplete(root, { results, focusPath, server, type, textDocument }) {
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
    let posStart = getBasicComponent().indexOf(PLACEHOLDER);
    let pos = posStart + realPath.length;
  //   console.log(service.getSyntacticDiagnostics(fileName).map((el)=>{
  //     console.log('getSyntacticDiagnostics', el.messageText, el.start, el.length);
  // }));
    const templateRange = [posStart, pos];
    const tsDiagnostics = service.getSemanticDiagnostics(fileName);
    const diagnostics: Diagnostic[] = tsDiagnostics.map((error: any) => toDiagnostic(error, templateRange, focusPath));
    server.connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });


    // console.log(service.getSemanticDiagnostics(fileName).map((el)=>{
      // const diagnostics: Diagnostic[] = errors.map((error: any) => toDiagnostic(el));

      // server.connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });


      // console.log('getSemanticDiagnostics', el.messageText, el.start, el.length);
  // }));
    // console.log(service.getSuggestionDiagnostics(fileName).map((el)=>{
    //     console.log('getSuggestionDiagnostics', el.messageText, el.start, el.length);
    // }));
    // console.log('getCompilerOptionsDiagnostics', service.getCompilerOptionsDiagnostics());

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
    console.error(e, e.ProgramFiles);
  }
  return results;
}
