
import {
    isParamPath,
    isArgumentName,
    realPathName,
    canHandle,
    normalizeArgumentName
} from "./../lib/ast-helpers";

import {
    normalizeDefinitions
} from "./../lib/ls-utils";

import { virtualTemplateFileName } from "./../lib/resolvers";

import { serviceForRoot, componentsForService } from './../lib/ts-service';
import { DefinitionFunctionParams } from '../interfaces';
import { Project } from '@lifeart/ember-language-server';
import { toFilePath } from '../lib/utils';
import VirtualDocumentProvider from './virtual-document';

export default class DefinitionProvider {
    constructor(private project: Project, private virtualDocument: VirtualDocumentProvider) { }
    async onDefinition(
        { results, focusPath, type, textDocument }: DefinitionFunctionParams
    ) {
        if (!canHandle(type, focusPath)) {
            return results;
        }
        try {
            const isParam = isParamPath(focusPath);
            const projectRoot = this.project.root;
            const service = serviceForRoot(projectRoot);
            const componentsMap = componentsForService(service);
            const templatePath = toFilePath(textDocument.uri);
            let isArg = false;
            let realPath = realPathName(focusPath);
            if (isArgumentName(realPath)) {
                isArg = true;
                realPath = normalizeArgumentName(realPath);
            }

            const fileName = virtualTemplateFileName(templatePath);
            const { pos } = this.virtualDocument.createVirtualTemplate(
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