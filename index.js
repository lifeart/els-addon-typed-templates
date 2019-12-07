"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var vscode_uri_1 = require("vscode-uri");
var vscode_languageserver_1 = require("vscode-languageserver");
var ts = require("typescript");
var path = require("path");
var fs = require("fs");
var walkSync = require("walk-sync");
var services = {};
var PLACEHOLDER = "ELSCompletionDummy";
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
    var indexes = new Set();
    var existingResultsMap = existingResults.reduce(function (hash, item) {
        hash[item.label] = item;
        indexes.add(item.label);
        return hash;
    }, {});
    newResults.forEach(function (el) {
        if (el.label in existingResultsMap) {
            Object.keys(el).forEach(function (key) {
                existingResultsMap[el.label][key] = el[key];
            });
        }
        else {
            existingResultsMap[el.label] = el;
            indexes.add(el.label);
        }
    });
    return Array.from(indexes).map(function (key) {
        return existingResultsMap[key];
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
    var kinds = {
        method: vscode_languageserver_1.CompletionItemKind.Method,
        "function": vscode_languageserver_1.CompletionItemKind.Function,
        constructor: vscode_languageserver_1.CompletionItemKind.Constructor,
        field: vscode_languageserver_1.CompletionItemKind.Field,
        variable: vscode_languageserver_1.CompletionItemKind.Variable,
        "class": vscode_languageserver_1.CompletionItemKind.Class,
        struct: vscode_languageserver_1.CompletionItemKind.Struct,
        interface: vscode_languageserver_1.CompletionItemKind.Interface,
        module: vscode_languageserver_1.CompletionItemKind.Module,
        property: vscode_languageserver_1.CompletionItemKind.Property,
        event: vscode_languageserver_1.CompletionItemKind.Event,
        operator: vscode_languageserver_1.CompletionItemKind.Operator,
        unit: vscode_languageserver_1.CompletionItemKind.Unit,
        value: vscode_languageserver_1.CompletionItemKind.Value,
        constant: vscode_languageserver_1.CompletionItemKind.Constant,
        "enum": vscode_languageserver_1.CompletionItemKind.Enum,
        "enum-member": vscode_languageserver_1.CompletionItemKind.EnumMember,
        keyword: vscode_languageserver_1.CompletionItemKind.Keyword,
        snippet: vscode_languageserver_1.CompletionItemKind.Snippet,
        text: vscode_languageserver_1.CompletionItemKind.Text,
        file: vscode_languageserver_1.CompletionItemKind.File,
        reference: vscode_languageserver_1.CompletionItemKind.Reference,
        folder: vscode_languageserver_1.CompletionItemKind.Folder,
        "type-parameter": vscode_languageserver_1.CompletionItemKind.TypeParameter
    };
    return kinds[tsName] || vscode_languageserver_1.CompletionItemKind.Property;
}
function getBasicComponent(pathExp, flags) {
    if (pathExp === void 0) { pathExp = PLACEHOLDER; }
    if (flags === void 0) { flags = {}; }
    var outputType = "string | number | void";
    var relImport = flags.relComponentImport || "./component";
    if (flags.isArrayCase) {
        outputType = "any[]";
    }
    return [
        "import Component from \"" + relImport + "\";",
        "export default class Template extends Component {",
        "_template_PathExpresion(): " + outputType + " {",
        "return " + pathExp,
        "}",
        "}"
    ].join("");
}
function serviceForRoot(uri) {
    if (!services[uri]) {
        var registry = ts.createDocumentRegistry(false, uri);
        var tsConfig_1 = {};
        if (fs.existsSync(path.join(uri, 'tsconfig.json'))) {
            try {
                tsConfig_1 = JSON.parse(fs.readFileSync(path.join(uri, 'tsconfig.json'), 'utf8'));
                if (tsConfig_1 && tsConfig_1.compilerOptions) {
                    tsConfig_1 = tsConfig_1.compilerOptions;
                }
            }
            catch (e) {
                // 
            }
        }
        // console.log('tsConfig', tsConfig);
        var host = {
            getCompilationSettings: function () {
                return Object.assign({}, tsConfig_1, {
                    baseUrl: '.',
                    allowJs: true,
                    allowSyntheticDefaultImports: true,
                    skipLibCheck: true,
                    moduleResolution: ts.ModuleResolutionKind.NodeJs,
                    module: ts.ModuleKind.ES2015
                });
            },
            getScriptFileNames: function () {
                var els = __spreadArrays(Object.keys(componentsMap), [
                    path.resolve(path.join(__dirname, "common-types.d.ts"))
                ]);
                var walkParams = {
                    directories: true,
                    globs: ["**/*.{js,ts,d.ts}"]
                };
                var appEntry = path.join(uri, "app");
                var addonEntry = path.join(uri, "addon");
                var typesEntry = path.join(uri, "types");
                var projectTypes = safeWalkSync(path.join(uri, "types"), walkParams).map(function (el) { return path.resolve(path.join(typesEntry, el)); });
                var projectAppFiles = safeWalkSync(path.join(uri, "app"), walkParams).map(function (el) { return path.resolve(path.join(appEntry, el)); });
                var projectAddonFiles = safeWalkSync(path.join(uri, "addon"), walkParams).map(function (el) { return path.resolve(path.join(addonEntry, el)); });
                return __spreadArrays(Array.from(new Set(__spreadArrays(els, projectAppFiles, projectAddonFiles, projectTypes))));
            },
            getScriptVersion: function (_fileName) {
                if (fs.existsSync(_fileName)) {
                    var stats = fs.statSync(_fileName);
                    return stats.mtime.getTime().toString();
                }
                return "";
            },
            getScriptSnapshot: function (fileName) {
                var maybeVirtualFile = componentsMap[path.resolve(fileName)];
                if (maybeVirtualFile) {
                    return ts.ScriptSnapshot.fromString(maybeVirtualFile);
                }
                else {
                    var name_1 = path.basename(fileName, path.extname(fileName));
                    if (fs.existsSync(fileName)) {
                        return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString());
                    }
                    else {
                        var libName = 'lib.' + name_1.toLowerCase() + '.d.ts';
                        var libFileNmae = path.join(path.dirname(fileName), libName);
                        if (fs.existsSync(libFileNmae)) {
                            return ts.ScriptSnapshot.fromString(fs.readFileSync(libFileNmae).toString());
                        }
                    }
                    console.log('getScriptSnapshot:unknownFileName', fileName);
                    return ts.ScriptSnapshot.fromString('');
                }
            },
            getCurrentDirectory: function () {
                return path.resolve(uri);
            },
            getDefaultLibFileName: function (opts) {
                return path.resolve(ts.getDefaultLibFilePath(opts));
            }
        };
        services[uri] = ts.createLanguageService(host, registry);
    }
    return services[uri];
}
var componentsMap = {};
function offsetToRange(start, limit, source) {
    var rLines = /(.*?(?:\r\n?|\n|$))/gm;
    var startLine = source.slice(0, start).match(rLines) || [];
    if (!source || startLine.length < 2) {
        return vscode_languageserver_1.Range.create(0, 0, 0, 0);
    }
    var line = startLine.length - 2;
    var col = startLine[startLine.length - 2].length;
    var endLine = source.slice(start, limit).match(rLines) || [];
    var endCol = col;
    var endLineNumber = line;
    if (endLine.length === 1) {
        endCol = col + limit;
        endLineNumber = line + endLine.length - 1;
    }
    else {
        endCol = endLine[endLine.length - 1].length;
    }
    return vscode_languageserver_1.Range.create(line, col, endLineNumber, endCol);
}
function tsDefinitionToLocation(el) {
    var scope = el.textSpan;
    var file = fs.readFileSync(el.fileName, "utf8");
    return vscode_languageserver_1.Location.create(vscode_uri_1.URI.file(el.fileName).toString(), offsetToRange(scope.start, scope.length, file));
}
function findComponentForTemplate(uri, projectRoot) {
    var absPath = path.resolve(vscode_uri_1.URI.parse(uri).fsPath);
    var fileName = path.basename(absPath, ".hbs");
    var dir = path.dirname(absPath);
    var classicComponentTemplatesLocation = 'app/templates/components';
    var normalizedDirname = dir.split(path.sep).join('/');
    var fileNames = [
        fileName + ".ts", "component.ts", fileName + ".js", "component.js"
    ];
    var posibleNames = fileNames.map(function (name) {
        return path.join(dir, name);
    });
    var relativePath = path.relative(projectRoot, dir).split(path.sep).join('/');
    if (relativePath.startsWith(classicComponentTemplatesLocation)) {
        var pureName = normalizedDirname.split(classicComponentTemplatesLocation).pop() + fileName;
        posibleNames.push(path.resolve(path.join(projectRoot, 'app', 'components', pureName + '.ts')));
        posibleNames.push(path.resolve(path.join(projectRoot, 'app', 'components', pureName, 'component.ts')));
        posibleNames.push(path.resolve(path.join(projectRoot, 'app', 'components', pureName, 'index.ts')));
        posibleNames.push(path.resolve(path.join(projectRoot, 'app', 'components', pureName + '.js')));
        posibleNames.push(path.resolve(path.join(projectRoot, 'app', 'components', pureName, 'component.js')));
        posibleNames.push(path.resolve(path.join(projectRoot, 'app', 'components', pureName, 'index.js')));
    }
    return posibleNames.filter(function (fileLocation) { return fs.existsSync(fileLocation); })[0];
}
function onDefinition(root, _a) {
    var results = _a.results, focusPath = _a.focusPath, type = _a.type, textDocument = _a.textDocument;
    return __awaiter(this, void 0, void 0, function () {
        var projectRoot, service, fileName, scriptForComponent, relComponentImport, realPath, pos;
        return __generator(this, function (_b) {
            if (type !== "template") {
                return [2 /*return*/, results];
            }
            if (focusPath.node.type !== "PathExpression") {
                return [2 /*return*/, results];
            }
            if (focusPath.node["this"] === false && focusPath.node.data === false) {
                return [2 /*return*/, results];
            }
            projectRoot = vscode_uri_1.URI.parse(root).fsPath;
            service = serviceForRoot(projectRoot);
            try {
                fileName = path
                    .resolve(vscode_uri_1.URI.parse(textDocument.uri).fsPath)
                    .replace(".hbs", "_template.ts");
                scriptForComponent = findComponentForTemplate(textDocument.uri, projectRoot);
                relComponentImport = path
                    .relative(fileName, scriptForComponent)
                    .replace(path.sep, "/")
                    .replace("..", ".")
                    .replace(".ts", "")
                    .replace(".js", "");
                componentsMap[scriptForComponent] = fs.readFileSync(scriptForComponent, "utf8");
                realPath = focusPath
                    .sourceForNode()
                    .replace(PLACEHOLDER, "")
                    .replace("@", "this.args.");
                componentsMap[fileName] = getBasicComponent(realPath, {
                    relComponentImport: relComponentImport
                });
                pos = getBasicComponent(PLACEHOLDER, { relComponentImport: relComponentImport }).indexOf(PLACEHOLDER) + realPath.length;
                results = service.getDefinitionAtPosition(fileName, pos);
                return [2 /*return*/, (results || [])
                        .filter(function (_a) {
                        var name = _a.name;
                        return !name.startsWith("_t");
                    })
                        .map(function (el) {
                        return tsDefinitionToLocation(el);
                    })];
            }
            catch (e) {
                console.error(e, e.ProgramFiles);
            }
            return [2 /*return*/, results];
        });
    });
}
exports.onDefinition = onDefinition;
function toDiagnostic(err, _a, focusPath) {
    var startIndex = _a[0], endIndex = _a[1];
    var errText = err.file.text.slice(err.start, err.start + err.length);
    if ((err.start >= startIndex && err.length + err.start <= endIndex) ||
        errText.startsWith("return ")) {
        var loc = focusPath.node.loc;
        return {
            severity: vscode_languageserver_1.DiagnosticSeverity.Error,
            range: loc
                ? vscode_languageserver_1.Range.create(loc.start.line - 1, loc.start.column, loc.end.line - 1, loc.end.column)
                : vscode_languageserver_1.Range.create(0, 0, 0, 0),
            message: err.messageText,
            source: "typed-templates"
        };
    }
    else {
        return {
            severity: vscode_languageserver_1.DiagnosticSeverity.Error,
            range: offsetToRange(0, 0, ""),
            message: err.messageText,
            source: "typed-templates"
        };
    }
}
exports.toDiagnostic = toDiagnostic;
function onComplete(root, _a) {
    var results = _a.results, focusPath = _a.focusPath, server = _a.server, type = _a.type, textDocument = _a.textDocument;
    return __awaiter(this, void 0, void 0, function () {
        var projectRoot, service, isArg, isArrayCase, fileName, scriptForComponent, relComponentImport, realPath_1, posStart, pos, templateRange_1, tsDiagnostics, diagnostics, tsResults, data;
        return __generator(this, function (_b) {
            if (type !== "template") {
                return [2 /*return*/, results];
            }
            if (focusPath.node.type !== "PathExpression") {
                return [2 /*return*/, results];
            }
            if (focusPath.node["this"] === false && focusPath.node.data === false) {
                return [2 /*return*/, results];
            }
            projectRoot = vscode_uri_1.URI.parse(root).fsPath;
            service = serviceForRoot(projectRoot);
            isArg = false;
            isArrayCase = false;
            if (focusPath.parent.type === "BlockStatement") {
                if (focusPath.parent.path.original === "each" &&
                    focusPath.parent.params[0] === focusPath.node) {
                    isArrayCase = true;
                }
            }
            // console.log(focusPath.parent.type);
            try {
                fileName = path
                    .resolve(vscode_uri_1.URI.parse(textDocument.uri).fsPath)
                    .replace(".hbs", "_template.ts");
                scriptForComponent = findComponentForTemplate(textDocument.uri, projectRoot);
                componentsMap[scriptForComponent] = fs.readFileSync(scriptForComponent, "utf8");
                relComponentImport = path
                    .relative(fileName, scriptForComponent)
                    .split(path.sep).join('/')
                    .replace("..", ".")
                    .replace(".ts", "")
                    .replace(".js", "");
                realPath_1 = focusPath.sourceForNode().replace(PLACEHOLDER, "");
                if (realPath_1.startsWith("@")) {
                    isArg = true;
                    realPath_1 = realPath_1.replace("@", "this.args.");
                }
                componentsMap[fileName] = getBasicComponent(realPath_1, {
                    isArrayCase: isArrayCase,
                    relComponentImport: relComponentImport
                });
                posStart = getBasicComponent(PLACEHOLDER, {
                    isArrayCase: isArrayCase,
                    relComponentImport: relComponentImport
                }).indexOf(PLACEHOLDER);
                pos = posStart + realPath_1.length;
                templateRange_1 = [posStart, pos];
                tsDiagnostics = service.getSemanticDiagnostics(fileName);
                diagnostics = tsDiagnostics.map(function (error) {
                    return toDiagnostic(error, templateRange_1, focusPath);
                });
                server.connection.sendDiagnostics({ uri: textDocument.uri, diagnostics: diagnostics });
                tsResults = service.getCompletionsAtPosition(fileName, pos, {
                    includeInsertTextCompletions: true
                });
                data = (tsResults ? tsResults.entries : [])
                    .filter(function (_a) {
                    var name = _a.name;
                    return !name.startsWith("_t");
                })
                    .map(function (el) {
                    return {
                        label: isArg
                            ? realPath_1.replace("this.args.", "@") + el.name
                            : realPath_1 + el.name,
                        kind: itemKind(el.kind)
                    };
                });
                return [2 /*return*/, mergeResults(results, data)];
            }
            catch (e) {
                console.error(e, e.ProgramFiles);
            }
            return [2 /*return*/, results];
        });
    });
}
exports.onComplete = onComplete;
