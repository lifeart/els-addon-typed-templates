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
const ls_utils_1 = require("./lib/ls-utils");
const vscode_uri_1 = require("vscode-uri");
const resolvers_1 = require("./lib/resolvers");
const ts_service_1 = require("./lib/ts-service");
const virtual_documents_1 = require("./lib/virtual-documents");
function isTestFile(uri) {
    return uri.includes('tests');
}
function setupLinter(root, project, server) {
    project.addLinter((document) => __awaiter(this, void 0, void 0, function* () {
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
exports.setupLinter = setupLinter;
function lintFile(root, textDocument, server) {
    const templatePath = vscode_uri_1.URI.parse(textDocument.uri).fsPath;
    const marks = ['components', 'component', 'templates'];
    const foundMarks = marks.filter((mark) => templatePath.includes(mark));
    if (isTestFile(templatePath) || foundMarks.length === 0 || templatePath.endsWith('.d.ts')) {
        return [];
    }
    const projectRoot = vscode_uri_1.URI.parse(root).fsPath;
    const service = ts_service_1.serviceForRoot(projectRoot);
    const componentsMap = ts_service_1.componentsForService(service);
    const componentMeta = ts_service_1.typeForPath(projectRoot, templatePath);
    if (!componentMeta) {
        return;
    }
    const fullFileName = resolvers_1.virtualComponentTemplateFileName(templatePath);
    virtual_documents_1.createFullVirtualTemplate(projectRoot, componentsMap, templatePath, fullFileName, server, textDocument.uri, false, componentMeta);
    return ls_utils_1.getFullSemanticDiagnostics(service, fullFileName);
}
//# sourceMappingURL=linter.js.map