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
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_uri_1 = require("vscode-uri");
const utils_1 = require("./lib/utils");
const ast_helpers_1 = require("./lib/ast-helpers");
const resolvers_1 = require("./lib/resolvers");
const ts_service_1 = require("./lib/ts-service");
const virtual_documents_1 = require("./lib/virtual-documents");
const ls_utils_1 = require("./lib/ls-utils");
function onDefinition(root, { results, focusPath, type, textDocument }) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!ast_helpers_1.canHandle(type, focusPath)) {
            return results;
        }
        try {
            const isParam = ast_helpers_1.isParamPath(focusPath);
            const projectRoot = vscode_uri_1.URI.parse(root).fsPath;
            const service = ts_service_1.serviceForRoot(projectRoot);
            const componentsMap = ts_service_1.componentsForService(service, true);
            const templatePath = vscode_uri_1.URI.parse(textDocument.uri).fsPath;
            let isArg = false;
            let realPath = ast_helpers_1.realPathName(focusPath);
            if (ast_helpers_1.isArgumentName(realPath)) {
                isArg = true;
                realPath = ast_helpers_1.normalizeArgumentName(realPath);
            }
            // console.log('realPath', realPath);
            const fileName = resolvers_1.virtualTemplateFileName(templatePath);
            const { pos } = virtual_documents_1.createVirtualTemplate(projectRoot, componentsMap, fileName, {
                templatePath,
                realPath,
                isArg,
                isParam
            });
            results = service.getDefinitionAtPosition(fileName, pos);
            // console.log('definitions', results);
            const data = ls_utils_1.normalizeDefinitions(results);
            return data;
        }
        catch (e) {
            console.error(e, e.ProgramFiles);
        }
        return results;
    });
}
exports.onDefinition = onDefinition;
function onComplete(root, { results, focusPath, server, type, textDocument }) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!ast_helpers_1.canHandle(type, focusPath)) {
            return results;
        }
        try {
            const isParam = ast_helpers_1.isParamPath(focusPath);
            const projectRoot = vscode_uri_1.URI.parse(root).fsPath;
            const service = ts_service_1.serviceForRoot(projectRoot);
            const componentsMap = ts_service_1.componentsForService(service, true);
            const templatePath = vscode_uri_1.URI.parse(textDocument.uri).fsPath;
            let isArg = false;
            const isArrayCase = ast_helpers_1.isEachArgument(focusPath);
            let realPath = ast_helpers_1.realPathName(focusPath);
            if (ast_helpers_1.isArgumentName(realPath)) {
                isArg = true;
                realPath = ast_helpers_1.normalizeArgumentName(realPath);
            }
            // console.log('realPath', realPath);
            const fileName = resolvers_1.virtualTemplateFileName(templatePath);
            const fullFileName = resolvers_1.virtualComponentTemplateFileName(templatePath);
            virtual_documents_1.createFullVirtualTemplate(projectRoot, componentsMap, templatePath, fullFileName, server, textDocument.uri);
            const { pos } = virtual_documents_1.createVirtualTemplate(projectRoot, componentsMap, fileName, {
                templatePath,
                realPath,
                isArg,
                isParam,
                isArrayCase
            });
            // console.log('slice','`'+componentsMap[fileName].slice(pos,pos+2)+'`');
            // const templateRange: [number, number] = [posStart, pos];
            ls_utils_1.getFullSemanticDiagnostics(server, service, fullFileName, textDocument.uri);
            // getSemanticDiagnostics(
            //   server,
            //   service,
            //   templateRange,
            //   fullFileName,
            //   focusPath,
            //   textDocument.uri
            // );
            let tsResults = service.getCompletionsAtPosition(fileName, pos, {
                includeInsertTextCompletions: true
            });
            if (tsResults && tsResults.entries.length > 100) {
                // console.log('too match results', componentsMap[fileName], pos, componentsMap[fileName].length);
                return results;
            }
            // console.log('tsResults',  tsResults && tsResults.entries);
            let data = ls_utils_1.normalizeCompletions(tsResults, realPath, isArg);
            // console.log('data', data);
            // console.log('mergeResults(results, data);', mergeResults(results, data));
            return utils_1.mergeResults(results, data);
        }
        catch (e) {
            console.error(e, e.ProgramFiles);
        }
        return results;
    });
}
exports.onComplete = onComplete;
//# sourceMappingURL=index.js.map