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
const ast_helpers_1 = require("./../lib/ast-helpers");
const ls_utils_1 = require("./../lib/ls-utils");
const resolvers_1 = require("./../lib/resolvers");
const ts_service_1 = require("./../lib/ts-service");
const utils_1 = require("../lib/utils");
class DefinitionProvider {
    constructor(project, virtualDocument) {
        this.project = project;
        this.virtualDocument = virtualDocument;
    }
    onDefinition({ results, focusPath, type, textDocument }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!ast_helpers_1.canHandle(type, focusPath)) {
                return results;
            }
            try {
                const isParam = ast_helpers_1.isParamPath(focusPath);
                const projectRoot = this.project.root;
                const service = ts_service_1.serviceForRoot(projectRoot);
                const componentsMap = ts_service_1.componentsForService(service);
                const templatePath = utils_1.toFilePath(textDocument.uri);
                let isArg = false;
                let realPath = ast_helpers_1.realPathName(focusPath);
                if (ast_helpers_1.isArgumentName(realPath)) {
                    isArg = true;
                    realPath = ast_helpers_1.normalizeArgumentName(realPath);
                }
                const fileName = resolvers_1.virtualTemplateFileName(templatePath);
                const { pos } = this.virtualDocument.createVirtualTemplate(componentsMap, fileName, {
                    templatePath,
                    realPath,
                    isArg,
                    isParam
                });
                let definitionResults = service.getDefinitionAtPosition(fileName, pos);
                if (!definitionResults) {
                    return [];
                }
                const data = ls_utils_1.normalizeDefinitions(definitionResults);
                return data;
            }
            catch (e) {
                console.error(e, e.ProgramFiles);
            }
            return results;
        });
    }
}
exports.default = DefinitionProvider;
//# sourceMappingURL=definition.js.map