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
  if (!knownFiles.has(textDocument.uri)) {
    return;
  }
  const projectRoot = URI.parse(root).fsPath;
  const service = serviceForRoot(projectRoot);
  const componentsMap = componentsForService(service, true);
  const templatePath = URI.parse(textDocument.uri).fsPath;
  const fullFileName = virtualComponentTemplateFileName(templatePath);
  createFullVirtualTemplate(projectRoot, componentsMap, templatePath, fullFileName, server, textDocument.uri);
  return getFullSemanticDiagnostics(service, fullFileName);
}

function setupLinter(root, type: string, server, uri: string) {
  if (type !== 'template') {
    return;
  }
  if (hasLinter) {
    return;
  }

  if (Array.isArray(server.linters)) {
    server.linters.push(async (document: any)=>{
      let results: any = [];
      try {
        results = await lintFile(root, document, server)
        return results;
      } catch(e) {
        console.log(e);
      }
      return null;
    });
  } else {
    // will owerride templat-lint
    server.documents.onDidChangeContent((change: any)=>{
      try {
        let diagnostics = lintFile(root, change.document, server);
        server.connection.sendDiagnostics({ uri: change.document.uri, diagnostics });
      } catch(e) {
        console.log(e);
      }
    });
  }

  let diagnostics = lintFile(root, { uri }, server);
  server.connection.sendDiagnostics({ uri, diagnostics });

  hasLinter = true;
}

export async function onDefinition(
  root,
  { results, focusPath, server, type, textDocument }
) {
  setupLinter(root, type, server, textDocument.uri);

  if (!canHandle(type, focusPath)) {
    return results;
  }
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
  setupLinter(root, type, server, textDocument.uri);

  if (!canHandle(type, focusPath)) {
    return results;
  }
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
