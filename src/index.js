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
exports.__esModule = true;
var vscode_uri_1 = require("vscode-uri");
var utils_1 = require("./lib/utils");
var ast_helpers_1 = require("./lib/ast-helpers");
var resolvers_1 = require("./lib/resolvers");
var ts_service_1 = require("./lib/ts-service");
var virtual_documents_1 = require("./lib/virtual-documents");
var ls_utils_1 = require("./lib/ls-utils");
var componentsMap = {};
function onDefinition(root, _a) {
    var results = _a.results, focusPath = _a.focusPath, type = _a.type, textDocument = _a.textDocument;
    return __awaiter(this, void 0, void 0, function () {
        var isParam, projectRoot, service, templatePath, isArg, realPath, fileName, pos;
        return __generator(this, function (_b) {
            if (!ast_helpers_1.canHandle(type, focusPath)) {
                return [2 /*return*/, results];
            }
            try {
                isParam = ast_helpers_1.isParamPath(focusPath);
                projectRoot = vscode_uri_1.URI.parse(root).fsPath;
                service = ts_service_1.serviceForRoot(projectRoot, componentsMap);
                templatePath = vscode_uri_1.URI.parse(textDocument.uri).fsPath;
                isArg = false;
                realPath = ast_helpers_1.realPathName(focusPath);
                if (ast_helpers_1.isArgumentName(realPath)) {
                    isArg = true;
                    realPath = ast_helpers_1.normalizeArgumentName(realPath);
                }
                fileName = resolvers_1.virtualTemplateFileName(templatePath);
                pos = virtual_documents_1.createVirtualTemplate(projectRoot, componentsMap, fileName, {
                    templatePath: templatePath,
                    realPath: realPath,
                    isArg: isArg,
                    isParam: isParam
                }).pos;
                results = service.getDefinitionAtPosition(fileName, pos);
                return [2 /*return*/, ls_utils_1.normalizeDefinitions(results)];
            }
            catch (e) {
                console.error(e, e.ProgramFiles);
            }
            return [2 /*return*/, results];
        });
    });
}
exports.onDefinition = onDefinition;
function onComplete(root, _a) {
    var results = _a.results, focusPath = _a.focusPath, server = _a.server, type = _a.type, textDocument = _a.textDocument;
    return __awaiter(this, void 0, void 0, function () {
        var isParam, projectRoot, service, templatePath, isArg, isArrayCase, realPath, fileName, _b, posStart, pos, templateRange, tsResults, data;
        return __generator(this, function (_c) {
            if (!ast_helpers_1.canHandle(type, focusPath)) {
                return [2 /*return*/, results];
            }
            try {
                isParam = ast_helpers_1.isParamPath(focusPath);
                projectRoot = vscode_uri_1.URI.parse(root).fsPath;
                service = ts_service_1.serviceForRoot(projectRoot, componentsMap);
                templatePath = vscode_uri_1.URI.parse(textDocument.uri).fsPath;
                isArg = false;
                isArrayCase = ast_helpers_1.isEachArgument(focusPath);
                realPath = ast_helpers_1.realPathName(focusPath);
                if (ast_helpers_1.isArgumentName(realPath)) {
                    isArg = true;
                    realPath = ast_helpers_1.normalizeArgumentName(realPath);
                }
                fileName = resolvers_1.virtualTemplateFileName(templatePath);
                _b = virtual_documents_1.createVirtualTemplate(projectRoot, componentsMap, fileName, {
                    templatePath: templatePath,
                    realPath: realPath,
                    isArg: isArg,
                    isParam: isParam,
                    isArrayCase: isArrayCase
                }), posStart = _b.posStart, pos = _b.pos;
                templateRange = [posStart, pos];
                ls_utils_1.getSemanticDiagnostics(server, service, templateRange, fileName, focusPath, textDocument.uri);
                tsResults = service.getCompletionsAtPosition(fileName, pos, {
                    includeInsertTextCompletions: true
                });
                data = ls_utils_1.normalizeCompletions(tsResults, realPath, isArg);
                // console.log('data', tsResults);
                // console.log('mergeResults(results, data);', mergeResults(results, data));
                return [2 /*return*/, utils_1.mergeResults(results, data)];
            }
            catch (e) {
                console.error(e, e.ProgramFiles);
            }
            return [2 /*return*/, results];
        });
    });
}
exports.onComplete = onComplete;
