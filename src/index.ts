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
import { virtualTemplateFileName, virtualComponentTemplateFileName } from "./lib/resolvers";
import { serviceForRoot, componentsForService } from "./lib/ts-service";
import { createVirtualTemplate, createFullVirtualTemplate } from "./lib/virtual-documents";
import { positionForItem } from './lib/hbs-converter';
import {
  normalizeDefinitions,
  getFullSemanticDiagnostics,
  normalizeCompletions
} from "./lib/ls-utils";

let hasLinter: any = false;
let knownFiles: any = new Set();

function lintFile(root, textDocument, server) {
  const projectRoot = URI.parse(root).fsPath;
  const service = serviceForRoot(projectRoot);
  const componentsMap = componentsForService(service, true);
  const templatePath = URI.parse(textDocument.uri).fsPath;
  const fullFileName = virtualComponentTemplateFileName(templatePath);
  createFullVirtualTemplate(projectRoot, componentsMap, templatePath, fullFileName, server, textDocument.uri);
  getFullSemanticDiagnostics(server, service, fullFileName, textDocument.uri);
}

function setupLinter(root, server) {
  if (hasLinter) {
    return;
  }

  server.documents.onDidChangeContent((change: any)=>{
    try {
      lintFile(root, change.document, server)
    } catch(e) {
      console.log(e);
    }
  });


  hasLinter = true;
}

export async function onDefinition(
  root,
  { results, focusPath, server, type, textDocument }
) {
  
  if (!canHandle(type, focusPath)) {
    return results;
  }
  setupLinter(root, server);
  knownFiles.add(textDocument.uri);


  try {
    const isParam = isParamPath(focusPath);
    const projectRoot = URI.parse(root).fsPath;
    const service = serviceForRoot(projectRoot);
    const componentsMap = componentsForService(service, true);
    const templatePath = URI.parse(textDocument.uri).fsPath;
    let isArg = false;
    let realPath = realPathName(focusPath);
    if (isArgumentName(realPath)) {
      isArg = true;
      realPath = normalizeArgumentName(realPath);
    }
    // console.log('realPath', realPath);

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
    const data = normalizeDefinitions(results);
    return data;
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
  setupLinter(root, server);
  knownFiles.add(textDocument.uri);

  try {
    const isParam = isParamPath(focusPath);
    const projectRoot = URI.parse(root).fsPath;
    const service = serviceForRoot(projectRoot);
    const componentsMap = componentsForService(service, true);
    const templatePath = URI.parse(textDocument.uri).fsPath;
    let isArg = false;
    const isArrayCase = isEachArgument(focusPath);
    let realPath = realPathName(focusPath);
    if (isArgumentName(realPath)) {
      isArg = true;
      realPath = normalizeArgumentName(realPath);
    }

    const fileName = virtualTemplateFileName(templatePath);
    const fullFileName = virtualComponentTemplateFileName(templatePath);


    const { pos } = createVirtualTemplate(
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

    let tsResults: any = null;
    try {
      let markId = `; /*@path-mark ${positionForItem(focusPath.node)}*/`;
      // console.log('markId', markId);
      let tpl = createFullVirtualTemplate(projectRoot, componentsMap, templatePath, fullFileName, server, textDocument.uri, focusPath.content as string);
      // console.log('tpl', tpl);
      tsResults = service.getCompletionsAtPosition(fullFileName, tpl.indexOf(markId), {
        includeInsertTextCompletions: true
      });
      if (!tsResults || tsResults && tsResults.entries  > 100) {
        throw new Error("Too many or no results");
      }
    } catch(e) {
      tsResults = service.getCompletionsAtPosition(fileName, pos, {
        includeInsertTextCompletions: true
      });
    }

    if (tsResults && tsResults.entries.length > 100) {
      return results;
    }
    let data = normalizeCompletions(tsResults, realPath, isArg);
    return mergeResults(results, data);
  } catch (e) {
    console.error(e, e.ProgramFiles);
  }
  return results;
}
