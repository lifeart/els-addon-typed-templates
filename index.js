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
var ts = require("typescript");
var path = require("path");
var fs = require("fs");
var services = {};
var PLACEHOLDER = "ELSCompletionDummy";
function getBasicComponent(pathExp) {
    if (pathExp === void 0) { pathExp = PLACEHOLDER; }
    return [
        'import Component from "./component";',
        "export default class Template extends Component {",
        "_template_PathExpresion() {",
        "return " + pathExp,
        "}",
        "}"
    ].join('');
}
function serviceForRoot(uri) {
    if (!services[uri]) {
        var registry = ts.createDocumentRegistry(false, uri);
        var host = {
            getCompilationSettings: function () {
                return {};
            },
            getScriptFileNames: function () {
                var els = __spreadArrays(["ts-test.ts", "component.ts"], Object.keys(componentsMap).map(function (el) { return path.basename(el); })).map(function (name) {
                    return path.resolve(path.join(uri, name));
                });
                return els;
            },
            getScriptVersion: function (_fileName) {
                return "";
            },
            getScriptSnapshot: function (fileName) {
                var maybeVirtualFile = componentsMap[path.resolve(fileName)];
                if (maybeVirtualFile) {
                    return ts.ScriptSnapshot.fromString(maybeVirtualFile);
                }
                else
                    return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString());
            },
            getCurrentDirectory: function () { return uri; },
            getDefaultLibFileName: function (opts) {
                return ts.getDefaultLibFilePath(opts);
            }
        };
        services[uri] = ts.createLanguageService(host, registry);
    }
    return services[uri];
}
var componentsMap = {};
function onComplete(root, _a) {
    var results = _a.results, focusPath = _a.focusPath, type = _a.type, textDocument = _a.textDocument;
    return __awaiter(this, void 0, void 0, function () {
        var projectRoot, service, fileName, realPath_1, pos;
        return __generator(this, function (_b) {
            if (type !== "template") {
                return [2 /*return*/, results];
            }
            if (focusPath.node.type !== 'PathExpression') {
                return [2 /*return*/, results];
            }
            projectRoot = vscode_uri_1.URI.parse(root).fsPath;
            service = serviceForRoot(projectRoot);
            try {
                fileName = path.resolve(vscode_uri_1.URI.parse(textDocument.uri)
                    .fsPath).replace('.hbs', '.ts');
                realPath_1 = focusPath.sourceForNode().replace(PLACEHOLDER, '');
                componentsMap[fileName] = getBasicComponent(realPath_1);
                pos = getBasicComponent().indexOf(PLACEHOLDER) + realPath_1.length;
                results = service.getCompletionsAtPosition(fileName, pos, { includeInsertTextCompletions: true });
                return [2 /*return*/, results.entries.filter(function (_a) {
                        var name = _a.name;
                        return !name.startsWith('_t');
                    }).map(function (el) {
                        // console.log(el);
                        return {
                            label: realPath_1 + el.name
                        };
                    })];
            }
            catch (e) {
                // console.error(e, e.ProgramFiles);
            }
            return [2 /*return*/, results];
        });
    });
}
exports.onComplete = onComplete;
