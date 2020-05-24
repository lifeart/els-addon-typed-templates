import { URI } from "vscode-uri";
import { mergeResults, normalizeAngleTagName } from "./lib/utils";
import {
  isParamPath,
  isArgumentName,
  realPathName,
  canHandle,
  isExternalComponentArgument,
  relplaceFocusPathForExternalComponentArgument,
  isEachArgument,
  normalizeArgumentName
} from "./lib/ast-helpers";
import { virtualTemplateFileName, virtualComponentTemplateFileName } from "./lib/resolvers";
import { serviceForRoot, componentsForService, registerProject, typeForPath, serverForProject } from './lib/ts-service';
import { createVirtualTemplate, createFullVirtualTemplate } from "./lib/virtual-documents";
import { getFirstASTNode } from './lib/ast-parser';
import { positionForItem } from './lib/hbs-transform';
import {
  normalizeDefinitions,
  getFullSemanticDiagnostics,
  normalizeCompletions
} from "./lib/ls-utils";
function isTestFile(uri) {
  return uri.includes('tests');
}

let hasLinter: any = false;
/* */
function lintFile(root, textDocument, server) {
  const templatePath = URI.parse(textDocument.uri).fsPath;
  const marks = ['components', 'component', 'templates'];
  const foundMarks = marks.filter((mark) => templatePath.includes(mark));
  if (isTestFile(templatePath) || foundMarks.length === 0 || templatePath.endsWith('.d.ts')) {
    return [];
  }
  const projectRoot = URI.parse(root).fsPath;
  const service = serviceForRoot(projectRoot);
  const componentsMap = componentsForService(service);
  const componentMeta = typeForPath(projectRoot, templatePath);
  if (!componentMeta) {
    return;
  }
  const fullFileName = virtualComponentTemplateFileName(templatePath);
  createFullVirtualTemplate(projectRoot, componentsMap, templatePath, fullFileName, server, textDocument.uri, false, componentMeta);
  return getFullSemanticDiagnostics(service, fullFileName);
}

function setupLinter(root, project, server) {
  if (hasLinter) {
    return;
  }

  project.addLinter(async (document: any)=>{
    let results: any = [];
    try {
      results = await lintFile(root, document, server)
      return results;
    } catch(e) {
      console.log(e);
    }
    return null;
  });

  hasLinter = true;
}

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
    results = service.getDefinitionAtPosition(fileName, pos);
    const data = normalizeDefinitions(results);
    return data;
  } catch (e) {
    console.error(e, e.ProgramFiles);
  }
  return results;
}

export function onInit(server, item) {
  registerProject(item, server);
  setupLinter(item.root, item, server);
}

export async function onComplete(
  root,
  { results, focusPath, type, textDocument }
) {

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
    const projectRoot = URI.parse(root).fsPath;
    const service = serviceForRoot(projectRoot);
    const server = serverForProject(projectRoot);
    const componentsMap = componentsForService(service, true);
    let templatePath = URI.parse(textDocument.uri).fsPath;
    if (isExternalComponentArg) {
      let possibleTemplates = server.getRegistry(projectRoot).component[originalComponentName] || [];
      possibleTemplates.forEach((el)=>{
        if (el.endsWith('.hbs')) {
          templatePath = el;
        }
      })
    }
    const componentMeta = typeForPath(projectRoot, templatePath);
    if (!componentMeta) {
      return;
    }
    let isArg = false;
    const isArrayCase = isEachArgument(focusPath);
    let realPath = realPathName(focusPath);
    let content = focusPath.content;
    if (isArgumentName(realPath) || isExternalComponentArg) {
      isArg = true;
      if (isExternalComponentArg) {
        realPath = normalizeArgumentName(focusPath.node.name);
        content = `{{${realPath}}}`;
      } else {
        realPath = normalizeArgumentName(realPath);
      }
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

    let nodePosition = positionForItem(focusPath.node);

    let tsResults: any = null;
    try {
      if (isExternalComponentArg) {
        nodePosition = positionForItem((getFirstASTNode(content) as any).path);
      }
      let markId = `; /*@path-mark ${nodePosition}*/`;
      let tpl = createFullVirtualTemplate(projectRoot, componentsMap, templatePath, fullFileName, server, textDocument.uri, content as string, componentMeta);
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
