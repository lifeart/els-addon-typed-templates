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
const ts_service_1 = require("./lib/ts-service");
const linter_1 = require("./providers/linter");
const definition_1 = require("./providers/definition");
const completion_1 = require("./providers/completion");
const virtual_document_1 = require("./providers/virtual-document");
module.exports = class TypedTemplates {
    constructor() {
        // temporary context fix for UELS
        this.onInit = this.onInit.bind(this);
        this.onComplete = this.onComplete.bind(this);
        this.onDefinition = this.onDefinition.bind(this);
    }
    onInit(server, project) {
        this.server = server;
        this.project = project;
        this.virtualDocumentProvider = new virtual_document_1.default(server, project);
        this.definitionProvider = new definition_1.default(project, this.virtualDocumentProvider);
        this.completionProvider = new completion_1.default(project, this.virtualDocumentProvider);
        ts_service_1.registerProject(project, server);
        this.linter = linter_1.setupLinter(project, this.virtualDocumentProvider);
    }
    onComplete(_, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.completionProvider.onComplete(params);
        });
    }
    onDefinition(_, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.definitionProvider.onDefinition(params);
        });
    }
};
//# sourceMappingURL=index.js.map