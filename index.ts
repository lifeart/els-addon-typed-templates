import { URI } from "vscode-uri";
import {
  Location,
  Range,
  Diagnostic,
  DiagnosticSeverity,
  CompletionItemKind
} from "vscode-languageserver";
import * as ts from "typescript";
import * as path from "path";
import * as fs from "fs";
import * as walkSync from "walk-sync";

const services: any = {};
const PLACEHOLDER = "ELSCompletionDummy";

function safeWalkSync(filePath, opts) {
  if (!filePath) {
    return [];
  }
  if (!fs.existsSync(filePath)) {
    return [];
  }
  return walkSync(filePath, opts);
}

function mergeResults(existingResults, newResults) {
  let indexes = new Set();
  let existingResultsMap: any = existingResults.reduce((hash, item) => {
    hash[item.label] = item;
    indexes.add(item.label);
    return hash;
  }, {});
  newResults.forEach(el => {
    if (el.label in existingResultsMap) {
      Object.keys(el).forEach(key => {
        existingResultsMap[el.label][key] = el[key];
      });
    } else {
      existingResultsMap[el.label] = el;
      indexes.add(el.label);
    }
  });
  return Array.from(indexes).map(key => {
    return existingResultsMap[key as string];
  });
}

// function yieldedContext() {
//   return `
//   _template_BlockStatement_Each_FirstBlock() {
//     return this._template_PathExpresion()[0];
//   }
//   `;
// }

function itemKind(tsName) {
  const kinds = {
    method: CompletionItemKind.Method,
    function: CompletionItemKind.Function,
    constructor: CompletionItemKind.Constructor,
    field: CompletionItemKind.Field,
    variable: CompletionItemKind.Variable,
    class: CompletionItemKind.Class,
    struct: CompletionItemKind.Struct,
    interface: CompletionItemKind.Interface,
    module: CompletionItemKind.Module,
    property: CompletionItemKind.Property,
    event: CompletionItemKind.Event,
    operator: CompletionItemKind.Operator,
    unit: CompletionItemKind.Unit,
    value: CompletionItemKind.Value,
    constant: CompletionItemKind.Constant,
    enum: CompletionItemKind.Enum,
    "enum-member": CompletionItemKind.EnumMember,
    keyword: CompletionItemKind.Keyword,
    snippet: CompletionItemKind.Snippet,
    text: CompletionItemKind.Text,
    file: CompletionItemKind.File,
    reference: CompletionItemKind.Reference,
    folder: CompletionItemKind.Folder,
    "type-parameter": CompletionItemKind.TypeParameter
  };

  return kinds[tsName] || CompletionItemKind.Property;
}

function getBasicComponent(pathExp = PLACEHOLDER, flags: any = {}) {
  let outputType = "string | number | void";
  let relImport = flags.relComponentImport || "./component";
  if (flags.isArrayCase) {
    outputType = "any[]";
  }
  return [
    `import Component from "${relImport}";`,
    "export default class Template extends Component {",
    `_template_PathExpresion(): ${outputType} {`,
    "return " + pathExp,
    "}",
    "}"
  ].join("");
}

function serviceForRoot(uri): ts.LanguageService {
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
          moduleResolution: ts.ModuleResolutionKind.NodeJs,
          module: ts.ModuleKind.ES2015
        });
      },
      getScriptFileNames() {
        let els = [
          ...Object.keys(componentsMap),
          path.resolve(path.join(__dirname, "common-types.d.ts"))
        ];
        let walkParams = {
          directories: true,
          globs: ["**/*.{js,ts,d.ts}"]
        };
        let appEntry = path.join(uri, "app");
        let addonEntry = path.join(uri, "addon");
        let typesEntry = path.join(uri, "types");
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
              ...els,
              ...projectAppFiles,
              ...projectAddonFiles,
              ...projectTypes
            ])
          )
        ];
      },
      getScriptVersion(_fileName) {
        if (fs.existsSync(_fileName)) {
          let stats = fs.statSync(_fileName);
          return stats.mtime.getTime().toString();
        }
        return "";
      },
      getScriptSnapshot(fileName) {
        const maybeVirtualFile = componentsMap[path.resolve(fileName)];
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
          console.log("getScriptSnapshot:unknownFileName", fileName);
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
  let col = startLine[startLine.length - 2].length;
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
  let file = fs.readFileSync(el.fileName, "utf8");
  return Location.create(
    URI.file(el.fileName).toString(),
    offsetToRange(scope.start, scope.length, file)
  );
}

function findComponentForTemplate(uri, projectRoot) {
  const absPath = path.resolve(URI.parse(uri).fsPath);
  const fileName = path.basename(absPath, ".hbs");
  const dir = path.dirname(absPath);
  const classicComponentTemplatesLocation = "app/templates/components";
  const normalizedDirname = dir.split(path.sep).join("/");
  const fileNames = [
    fileName + ".ts",
    "component.ts",
    fileName + ".js",
    "component.js"
  ];
  const posibleNames = fileNames.map(name => path.join(dir, name));
  const relativePath = path
    .relative(projectRoot, dir)
    .split(path.sep)
    .join("/");
  if (relativePath.startsWith(classicComponentTemplatesLocation)) {
    const pureName =
      normalizedDirname.split(classicComponentTemplatesLocation).pop() +
      fileName;
    posibleNames.push(
      path.resolve(
        path.join(projectRoot, "app", "components", pureName + ".ts")
      )
    );
    posibleNames.push(
      path.resolve(
        path.join(projectRoot, "app", "components", pureName, "component.ts")
      )
    );
    posibleNames.push(
      path.resolve(
        path.join(projectRoot, "app", "components", pureName, "index.ts")
      )
    );

    posibleNames.push(
      path.resolve(
        path.join(projectRoot, "app", "components", pureName + ".js")
      )
    );
    posibleNames.push(
      path.resolve(
        path.join(projectRoot, "app", "components", pureName, "component.js")
      )
    );
    posibleNames.push(
      path.resolve(
        path.join(projectRoot, "app", "components", pureName, "index.js")
      )
    );
  }

  return posibleNames.filter(fileLocation => fs.existsSync(fileLocation))[0];
}

export async function onDefinition(
  root,
  { results, focusPath, type, textDocument }
) {
  if (type !== "template") {
    return results;
  }
  if (focusPath.node.type !== "PathExpression") {
    return results;
  }
  if (focusPath.node.this === false && focusPath.node.data === false) {
    return results;
  }
  const projectRoot = URI.parse(root).fsPath;
  const service = serviceForRoot(projectRoot);
  try {
    let fileName = path
      .resolve(URI.parse(textDocument.uri).fsPath)
      .replace(".hbs", "_template.ts");

    const scriptForComponent = findComponentForTemplate(
      textDocument.uri,
      projectRoot
    );
    const relComponentImport = relativeComponentImport(
      fileName,
      scriptForComponent
    );

    componentsMap[scriptForComponent] = fs.readFileSync(
      scriptForComponent,
      "utf8"
    );
    let realPath = focusPath
      .sourceForNode()
      .replace(PLACEHOLDER, "")
      .replace("@", "this.args.");
    componentsMap[fileName] = getBasicComponent(realPath, {
      relComponentImport
    });
    let pos =
      getBasicComponent(PLACEHOLDER, { relComponentImport }).indexOf(
        PLACEHOLDER
      ) + realPath.length;
    results = service.getDefinitionAtPosition(fileName, pos);
    return (results || [])
      .filter(({ name }) => !name.startsWith("_t"))
      .map(el => {
        return tsDefinitionToLocation(el);
      });
  } catch (e) {
    console.error(e, e.ProgramFiles);
  }
  return results;
}

function relativeComponentImport(templateFileName, scriptForComponent) {
  return path
    .relative(templateFileName, scriptForComponent)
    .split(path.sep)
    .join("/")
    .replace("..", ".")
    .replace(".ts", "")
    .replace(".js", "");
}

export function toDiagnostic(
  err,
  [startIndex, endIndex],
  focusPath
): Diagnostic {
  let errText = err.file.text.slice(err.start, err.start + err.length);
  if (
    (err.start >= startIndex && err.length + err.start <= endIndex) ||
    errText.startsWith("return ")
  ) {
    let loc = focusPath.node.loc;
    return {
      severity: DiagnosticSeverity.Error,
      range: loc
        ? Range.create(
            loc.start.line - 1,
            loc.start.column,
            loc.end.line - 1,
            loc.end.column
          )
        : Range.create(0, 0, 0, 0),
      message: err.messageText,
      source: "typed-templates"
    };
  } else {
    return {
      severity: DiagnosticSeverity.Error,
      range: offsetToRange(0, 0, ""),
      message: err.messageText,
      source: "typed-templates"
    };
  }
}

export async function onComplete(
  root,
  { results, focusPath, server, type, textDocument }
) {
  if (type !== "template") {
    return results;
  }
  if (focusPath.node.type !== "PathExpression") {
    return results;
  }
  if (focusPath.node.this === false && focusPath.node.data === false) {
    return results;
  }

  const projectRoot = URI.parse(root).fsPath;
  const service = serviceForRoot(projectRoot);
  let isArg = false;
  let isArrayCase = false;

  if (focusPath.parent.type === "BlockStatement") {
    if (
      focusPath.parent.path.original === "each" &&
      focusPath.parent.params[0] === focusPath.node
    ) {
      isArrayCase = true;
    }
  }
  // console.log(focusPath.parent.type);
  try {
    let fileName = path
      .resolve(URI.parse(textDocument.uri).fsPath)
      .replace(".hbs", "_template.ts");

    const scriptForComponent = findComponentForTemplate(
      textDocument.uri,
      projectRoot
    );
    componentsMap[scriptForComponent] = fs.readFileSync(
      scriptForComponent,
      "utf8"
    );
    const relComponentImport = relativeComponentImport(
      fileName,
      scriptForComponent
    );
    // console.log("relComponentImport", relComponentImport);
    // console.log("scriptForComponent", scriptForComponent);
    let realPath = focusPath.sourceForNode().replace(PLACEHOLDER, "");
    if (realPath.startsWith("@")) {
      isArg = true;
      realPath = realPath.replace("@", "this.args.");
    }

    componentsMap[fileName] = getBasicComponent(realPath, {
      isArrayCase,
      relComponentImport
    });
    // console.log('componentsMap[fileName]', componentsMap[fileName]);
    // console.log(Object.keys(componentsMap));
    let posStart = getBasicComponent(PLACEHOLDER, {
      isArrayCase,
      relComponentImport
    }).indexOf(PLACEHOLDER);
    let pos = posStart + realPath.length;
    //   console.log(service.getSyntacticDiagnostics(fileName).map((el)=>{
    //     console.log('getSyntacticDiagnostics', el.messageText, el.start, el.length);
    // }));
    const templateRange: [number, number] = [posStart, pos];
    const tsDiagnostics = service.getSemanticDiagnostics(fileName);
    const diagnostics: Diagnostic[] = tsDiagnostics.map((error: any) =>
      toDiagnostic(error, templateRange, focusPath)
    );
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

    let tsResults = service.getCompletionsAtPosition(fileName, pos, {
      includeInsertTextCompletions: true
    });
    let data = (tsResults ? tsResults.entries : [])
      .filter(({ name }) => !name.startsWith("_t"))
      .map(el => {
        return {
          label: isArg
            ? realPath.replace("this.args.", "@") + el.name
            : realPath + el.name,
          kind: itemKind(el.kind)
        };
      });
    // console.log('data', tsResults);
    // console.log('mergeResults(results, data);', mergeResults(results, data));
    return mergeResults(results, data);
  } catch (e) {
    console.error(e, e.ProgramFiles);
  }
  return results;
}
