

import { Project, CompletionFunctionParams } from '../interfaces';
import { CompletionItem } from 'vscode-languageserver';

import { mergeResults, normalizeAngleTagName, toFilePath } from "./../lib/utils";

import { serviceForRoot, componentsForService, typeForPath, serverForProject } from './../lib/ts-service';

import { virtualTemplateFileName, virtualComponentTemplateFileName } from "./../lib/resolvers";
import * as fs from 'fs';
import { positionForItem } from './../lib/ast-helpers';
import { getFirstASTNode } from './../lib/ast-parser';
import { normalizeCompletions } from './../lib/ls-utils';
import { isHBS } from './../lib/utils';
import VirtualDocumentProvider from './virtual-document';

import {
    isParamPath,
    isArgumentName,
    realPathName,
    canHandle,
    isExternalComponentArgument,
    relplaceFocusPathForExternalComponentArgument,
    isEachArgument,
    normalizeArgumentName
} from "./../lib/ast-helpers";

export default class CompletionProvider {
    constructor(private project: Project, private virtualDocument: VirtualDocumentProvider) { }
    async  onComplete(

        { results, focusPath, type, textDocument }: CompletionFunctionParams
    ): Promise<CompletionItem[] | null> {

        if (!canHandle(type, focusPath)) {
            return results;
        }

        try {
            const isParam = isParamPath(focusPath);
            const isExternalComponentArg = isExternalComponentArgument(focusPath);
            let originalComponentName = '';
            if (isExternalComponentArg) {
                focusPath = relplaceFocusPathForExternalComponentArgument(focusPath);
                originalComponentName = normalizeAngleTagName(focusPath.parent.tag);
            }
            const projectRoot = this.project.root;
            const service = serviceForRoot(projectRoot);
            const server = serverForProject(projectRoot);
            const componentsMap = componentsForService(service, true);
            let templatePath = toFilePath(textDocument.uri);
            if (isExternalComponentArg) {
                let possibleTemplates = server.getRegistry(projectRoot).component[originalComponentName] || [];
                possibleTemplates.forEach((el) => {
                    if (isHBS(el)) {
                        templatePath = el;
                    }
                })
            }
            const componentMeta = typeForPath(projectRoot, templatePath);
            if (!componentMeta) {
                return null;
            }
            let isArg = false;
            const isArrayCase = isEachArgument(focusPath);
            let realPath = realPathName(focusPath);
            let content = focusPath.content;
            if (isArgumentName(realPath) || isExternalComponentArg) {
                isArg = true;
                if (isExternalComponentArg) {
                    realPath = normalizeArgumentName(focusPath.node.name);
                    let realContent = fs.readFileSync(templatePath, 'utf8');
                    content = `{{${realPath}}}${realContent}`;
                } else {
                    realPath = normalizeArgumentName(realPath);
                }
            }

            const fileName = virtualTemplateFileName(templatePath);
            const fullFileName = virtualComponentTemplateFileName(templatePath);


            const { pos } = this.virtualDocument.createVirtualTemplate(
                componentsMap,
                fileName,
                {
                    templatePath,
                    realPath,
                    isArg,
                    isParam,
                    isArrayCase
                }
            );

            let nodePosition = positionForItem(focusPath.node);

            let tsResults: any = null;
            try {
                if (isExternalComponentArg) {
                    nodePosition = positionForItem((getFirstASTNode(content) as any).path);
                }
                let markId = `; /*@path-mark ${nodePosition}*/`;
                let tpl = this.virtualDocument.createFullVirtualTemplate(componentsMap, templatePath, fullFileName, textDocument.uri, content as string, componentMeta);
                tsResults = service.getCompletionsAtPosition(fullFileName, tpl.indexOf(markId), {
                    includeInsertTextCompletions: true
                });
                if (!tsResults || tsResults && tsResults.entries > 100) {
                    throw new Error("Too many or no results");
                }
            } catch (e) {
                tsResults = service.getCompletionsAtPosition(fileName, pos, {
                    includeInsertTextCompletions: true
                });
            }

            if (tsResults && tsResults.entries.length > 100) {
                return results;
            }
            let data = normalizeCompletions(tsResults, realPath, isArg);
            return mergeResults(results, data) as CompletionItem[];
        } catch (e) {
            console.error(e, e.ProgramFiles);
        }
        return results;
    }
}