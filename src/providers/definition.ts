
import {
    isParamPath,
    isArgumentName,
    realPathName,
    canHandle,
    normalizeArgumentName
} from "./../lib/ast-helpers";

import { createVirtualTemplate } from "./../lib/virtual-documents";

import {
    normalizeDefinitions
} from "./../lib/ls-utils";

import { virtualTemplateFileName } from "./../lib/resolvers";

import { URI } from "vscode-uri";

import { serviceForRoot, componentsForService } from './../lib/ts-service';
import { Project, DefinitionFunctionParams } from '../interfaces';

export default class DefinitionProvider {
    constructor(private project: Project) { }
    async onDefinition(
        { results, focusPath, type, textDocument } : DefinitionFunctionParams
    ) {
        if (!canHandle(type, focusPath)) {
            return results;
        }
        const root = this.project.root;

        try {
            const isParam = isParamPath(focusPath);
            const projectRoot = URI.parse(root).fsPath;
            const service = serviceForRoot(projectRoot);
            const componentsMap = componentsForService(service);
            const templatePath = URI.parse(textDocument.uri).fsPath;
            let isArg = false;
            let realPath = realPathName(focusPath);
            if (isArgumentName(realPath)) {
                isArg = true;
                realPath = normalizeArgumentName(realPath);
            }

            const fileName = virtualTemplateFileName(templatePath);
            const { pos } = createVirtualTemplate(
                projectRoot,
                componentsMap,
                fileName,
                {
                    templatePath,
                    realPath,
                    isArg,
                    isParam
                }
            );
            let definitionResults = service.getDefinitionAtPosition(fileName, pos);
            if (!definitionResults) {
                return [];
            }
            const data = normalizeDefinitions(definitionResults);
            return data;
        } catch (e) {
            console.error(e, e.ProgramFiles);
        }
        return results;
    }
}