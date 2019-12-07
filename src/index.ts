import { URI } from "vscode-uri";
import { mergeResults } from "./lib/utils";
import {
  isParamPath,
  isArgumentName,
  realPathName,
  canHandle,
  isEachArgument,
  normalizeArgumentName
} from "./lib/ast-helpers";
import { virtualTemplateFileName } from "./lib/resolvers";
import { serviceForRoot } from "./lib/ts-service";
import { createVirtualTemplate } from "./lib/virtual-documents";
import {
  normalizeDefinitions,
  getSemanticDiagnostics,
  normalizeCompletions
} from "./lib/ls-utils";

const componentsMap = {};

export async function onDefinition(
  root,
  { results, focusPath, type, textDocument }
) {
  
  if (!canHandle(type, focusPath)) {
    return results;
  }

  try {
    const isParam = isParamPath(focusPath);
    const projectRoot = URI.parse(root).fsPath;
    const service = serviceForRoot(projectRoot, componentsMap);
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
    results = service.getDefinitionAtPosition(fileName, pos);
    return normalizeDefinitions(results);
  } catch (e) {
    console.error(e, e.ProgramFiles);
  }
  return results;
}

export async function onComplete(
  root,
  { results, focusPath, server, type, textDocument }
) {
  if (!canHandle(type, focusPath)) {
    return results;
  }

  try {
    const isParam = isParamPath(focusPath);
    const projectRoot = URI.parse(root).fsPath;
    const service = serviceForRoot(projectRoot, componentsMap);
    const templatePath = URI.parse(textDocument.uri).fsPath;

    let isArg = false;
    const isArrayCase = isEachArgument(focusPath);
    let realPath = realPathName(focusPath);
    if (isArgumentName(realPath)) {
      isArg = true;
      realPath = normalizeArgumentName(realPath);
    }

    const fileName = virtualTemplateFileName(templatePath);

    const { posStart, pos } = createVirtualTemplate(
      projectRoot,
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

    const templateRange: [number, number] = [posStart, pos];
    getSemanticDiagnostics(
      server,
      service,
      templateRange,
      fileName,
      focusPath,
      textDocument.uri
    );
    let tsResults = service.getCompletionsAtPosition(fileName, pos, {
      includeInsertTextCompletions: true
    });
    let data = normalizeCompletions(tsResults, realPath, isArg);
    // console.log('data', tsResults);
    // console.log('mergeResults(results, data);', mergeResults(results, data));
    return mergeResults(results, data);
  } catch (e) {
    console.error(e, e.ProgramFiles);
  }
  return results;
}
