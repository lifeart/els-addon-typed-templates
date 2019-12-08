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
const hbs_converter_1 = require("./lib/hbs-converter");
const ls_utils_1 = require("./lib/ls-utils");
let hasLinter = false;
let knownFiles = new Set();
function lintFile(root, textDocument, server) {
    if (!knownFiles.has(textDocument.uri)) {
        return;
    }
    const projectRoot = vscode_uri_1.URI.parse(root).fsPath;
    const service = ts_service_1.serviceForRoot(projectRoot);
    const componentsMap = ts_service_1.componentsForService(service, true);
    const templatePath = vscode_uri_1.URI.parse(textDocument.uri).fsPath;
    const fullFileName = resolvers_1.virtualComponentTemplateFileName(templatePath);
    virtual_documents_1.createFullVirtualTemplate(projectRoot, componentsMap, templatePath, fullFileName, server, textDocument.uri);
    return ls_utils_1.getFullSemanticDiagnostics(service, fullFileName);
}
function setupLinter(root, type, server) {
    if (type !== 'template') {
        return;
    }
    if (hasLinter) {
        return;
    }
    if (Array.isArray(server.linters)) {
        server.linters.push((document) => __awaiter(this, void 0, void 0, function* () {
            let results = [];
            try {
                results = yield lintFile(root, document, server);
                return results;
            }
            catch (e) {
                console.log(e);
            }
            return null;
        }));
    }
    else {
        // will owerride templat-lint
        server.documents.onDidChangeContent((change) => {
            try {
                let diagnostics = lintFile(root, change.document, server);
                server.connection.sendDiagnostics({ uri: change.document.uri, diagnostics });
            }
            catch (e) {
                console.log(e);
            }
        });
    }
    hasLinter = true;
}
function onDefinition(root, { results, focusPath, server, type, textDocument }) {
    return __awaiter(this, void 0, void 0, function* () {
        setupLinter(root, type, server);
        if (!ast_helpers_1.canHandle(type, focusPath)) {
            return results;
        }
        knownFiles.add(textDocument.uri);
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
        setupLinter(root, type, server);
        if (!ast_helpers_1.canHandle(type, focusPath)) {
            return results;
        }
        knownFiles.add(textDocument.uri);
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
            const fileName = resolvers_1.virtualTemplateFileName(templatePath);
            const fullFileName = resolvers_1.virtualComponentTemplateFileName(templatePath);
            const { pos } = virtual_documents_1.createVirtualTemplate(projectRoot, componentsMap, fileName, {
                templatePath,
                realPath,
                isArg,
                isParam,
                isArrayCase
            });
            let tsResults = null;
            try {
                let markId = `; /*@path-mark ${hbs_converter_1.positionForItem(focusPath.node)}*/`;
                // console.log('markId', markId);
                let tpl = virtual_documents_1.createFullVirtualTemplate(projectRoot, componentsMap, templatePath, fullFileName, server, textDocument.uri, focusPath.content);
                // console.log('tpl', tpl);
                tsResults = service.getCompletionsAtPosition(fullFileName, tpl.indexOf(markId), {
                    includeInsertTextCompletions: true
                });
                if (!tsResults || tsResults && tsResults.entries > 100) {
                    throw new Error("Too many or no results");
                }
            }
            catch (e) {
                tsResults = service.getCompletionsAtPosition(fileName, pos, {
                    includeInsertTextCompletions: true
                });
            }
            if (tsResults && tsResults.entries.length > 100) {
                return results;
            }
            let data = ls_utils_1.normalizeCompletions(tsResults, realPath, isArg);
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