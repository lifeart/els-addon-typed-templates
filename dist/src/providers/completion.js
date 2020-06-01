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
const utils_1 = require("./../lib/utils");
const ts_service_1 = require("./../lib/ts-service");
const resolvers_1 = require("./../lib/resolvers");
const fs = require("fs");
const ast_helpers_1 = require("./../lib/ast-helpers");
const ast_parser_1 = require("./../lib/ast-parser");
const ls_utils_1 = require("./../lib/ls-utils");
const ast_helpers_2 = require("./../lib/ast-helpers");
class CompletionProvider {
    constructor(project, virtualDocument) {
        this.project = project;
        this.virtualDocument = virtualDocument;
    }
    onComplete({ results, focusPath, type, textDocument }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!ast_helpers_2.canHandle(type, focusPath)) {
                return results;
            }
            try {
                const isParam = ast_helpers_2.isParamPath(focusPath);
                const isExternalComponentArg = ast_helpers_2.isExternalComponentArgument(focusPath);
                let originalComponentName = '';
                if (isExternalComponentArg) {
                    focusPath = ast_helpers_2.relplaceFocusPathForExternalComponentArgument(focusPath);
                    originalComponentName = utils_1.normalizeAngleTagName(focusPath.parent.tag);
                }
                const projectRoot = this.project.root;
                const service = ts_service_1.serviceForRoot(projectRoot);
                const server = ts_service_1.serverForProject(projectRoot);
                const componentsMap = ts_service_1.componentsForService(service, true);
                let templatePath = utils_1.toFilePath(textDocument.uri);
                if (isExternalComponentArg) {
                    let possibleTemplates = server.getRegistry(projectRoot).component[originalComponentName] || [];
                    possibleTemplates.forEach((el) => {
                        if (el.endsWith('.hbs')) {
                            templatePath = el;
                        }
                    });
                }
                const componentMeta = ts_service_1.typeForPath(projectRoot, templatePath);
                if (!componentMeta) {
                    return null;
                }
                let isArg = false;
                const isArrayCase = ast_helpers_2.isEachArgument(focusPath);
                let realPath = ast_helpers_2.realPathName(focusPath);
                let content = focusPath.content;
                if (ast_helpers_2.isArgumentName(realPath) || isExternalComponentArg) {
                    isArg = true;
                    if (isExternalComponentArg) {
                        realPath = ast_helpers_2.normalizeArgumentName(focusPath.node.name);
                        let realContent = fs.readFileSync(templatePath, 'utf8');
                        content = `{{${realPath}}}${realContent}`;
                    }
                    else {
                        realPath = ast_helpers_2.normalizeArgumentName(realPath);
                    }
                }
                const fileName = resolvers_1.virtualTemplateFileName(templatePath);
                const fullFileName = resolvers_1.virtualComponentTemplateFileName(templatePath);
                const { pos } = this.virtualDocument.createVirtualTemplate(componentsMap, fileName, {
                    templatePath,
                    realPath,
                    isArg,
                    isParam,
                    isArrayCase
                });
                let nodePosition = ast_helpers_1.positionForItem(focusPath.node);
                let tsResults = null;
                try {
                    if (isExternalComponentArg) {
                        nodePosition = ast_helpers_1.positionForItem(ast_parser_1.getFirstASTNode(content).path);
                    }
                    let markId = `; /*@path-mark ${nodePosition}*/`;
                    let tpl = this.virtualDocument.createFullVirtualTemplate(componentsMap, templatePath, fullFileName, textDocument.uri, content, componentMeta);
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
}
exports.default = CompletionProvider;
//# sourceMappingURL=completion.js.map