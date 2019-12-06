import { URI } from "vscode-uri";
import { Location, Range, Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';
import * as ts from "typescript";
import * as path from "path";
import * as fs from "fs";

const services: any = {};
const PLACEHOLDER = "ELSCompletionDummy";

function getBasicComponent(pathExp = PLACEHOLDER, flags : any = {}) {
  let outputType = 'string | number | void';
  let relImport = flags.relComponentImport || './component';
  if (flags.isArrayCase) {
    outputType = 'any[]';
  }
  return [
    `import Component from "${relImport}";`,
    "export default class Template extends Component {",
    `_template_PathExpresion(): ${outputType} {`,
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
        let els = [...Object.keys(componentsMap).map((el)=>path.basename(el))].map(name =>
          path.resolve(path.join(uri, name))
        );
        return [...Array.from(new Set(els))];
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
  if (!source || startLine.length < 2) {
    return Range.create(0, 0, 0, 0);
  }
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

function findComponentForTemplate(uri) {
  const absPath = path.resolve(URI.parse(uri).fsPath);
  const fileName = path.basename(absPath, '.hbs');
  const dir = path.dirname(absPath);
  const posibleNames = [fileName + '.ts', fileName + '.js'].map(name=>path.join(dir, name));
  return posibleNames.filter(fileLocation=>fs.existsSync(fileLocation))[0]
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
    .fsPath).replace('.hbs','_template.ts');

    const scriptForComponent = findComponentForTemplate(textDocument.uri);
    const relComponentImport = path.relative(fileName, scriptForComponent).replace(path.sep, '/').replace('..', '.').replace('.ts', '').replace('.js', '');

    componentsMap[scriptForComponent] = fs.readFileSync(scriptForComponent, 'utf8');
    let realPath = focusPath.sourceForNode().replace(PLACEHOLDER, '').replace('@','this.args.');
    componentsMap[fileName] = getBasicComponent(realPath, { relComponentImport });
    let pos = getBasicComponent(PLACEHOLDER, { relComponentImport }).indexOf(PLACEHOLDER) + realPath.length;
    results = service.getDefinitionAtPosition(fileName, pos);
    return (results||[]).filter(({name})=>!name.startsWith('_t')).map((el)=>{
      return  tsDefinitionToLocation(el);
    })
  } catch (e) {
    console.error(e, e.ProgramFiles);
  }
  return results;
}

export function toDiagnostic(err, [startIndex, endIndex], focusPath): Diagnostic {
  let errText = err.file.text.slice(err.start, err.start + err.length);
  if (err.start>=startIndex && (err.length + err.start ) <= endIndex || errText.startsWith('return ')) {
    let loc = focusPath.node.loc;
    return {
      severity: DiagnosticSeverity.Error,
      range:  loc ? Range.create(loc.start.line - 1, loc.start.column, loc.end.line - 1, loc.end.column) : Range.create(0, 0, 0, 0),
      message: err.messageText,
      source: 'typed-templates'
    };
  } else {
    return {
      severity: DiagnosticSeverity.Error,
      range: offsetToRange(0, 0, ''),
      message: err.messageText,
      source: 'typed-templates'
    };
  }
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
  let isArg = false;
  let isArrayCase = false;

  if (focusPath.parent.type === 'BlockStatement') {
    if (focusPath.parent.path.original === 'each' && focusPath.parent.params[0] === focusPath.node) {
      isArrayCase = true;
    }
  }
  // console.log(focusPath.parent.type);
  try {
    let fileName = path.resolve(URI.parse(textDocument.uri)
    .fsPath).replace('.hbs','_template.ts');

    const scriptForComponent = findComponentForTemplate(textDocument.uri);
    componentsMap[scriptForComponent] = fs.readFileSync(scriptForComponent, 'utf8');

    const relComponentImport = path.relative(fileName, scriptForComponent).replace(path.sep, '/').replace('..', '.').replace('.ts', '').replace('.js', '');

    let realPath = focusPath.sourceForNode().replace(PLACEHOLDER, '');
    if (realPath.startsWith('@')) {
      isArg = true;
      realPath = realPath.replace('@','this.args.');
    }
    
    componentsMap[fileName] = getBasicComponent(realPath, { isArrayCase, relComponentImport });
    let posStart = getBasicComponent(PLACEHOLDER, { isArrayCase, relComponentImport }).indexOf(PLACEHOLDER);
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
    return (results ? results.entries : []).filter(({name})=>!name.startsWith('_t')).map((el)=>{
      return {
        label: isArg ? realPath.replace('this.args.', '@') + el.name : realPath + el.name
      };
    })
  } catch (e) {
    console.error(e, e.ProgramFiles);
  }
  return results;
}
