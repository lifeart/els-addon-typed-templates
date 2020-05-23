import * as path from "path";
import * as fs from "fs";
import { serverForProject, typeForPath } from './ts-service';

export function virtualTemplateFileName(fsPath) {
  const extName = path.extname(fsPath);
  return path
    .resolve(fsPath)
    .replace(extName, "--virtual-typed-template.ts");
}

export function virtualComponentTemplateFileName(fsPath) {
  const extName = path.extname(fsPath);
  return path
    .resolve(fsPath)
    .replace(extName, "--virtual-typed-component-template.ts");
}

export function relativeImport(templateFile, scriptFile) {
  return path
    .relative(templateFile, scriptFile)
    .split(path.sep)
    .join("/")
    .replace("..", ".")
    .replace(".ts", "")
    .replace(".js", "");
}

export function ralativeAddonImport(
  templateFileName: string,
  addonItemFileName: string
): string | null {
  let extname = path.extname(addonItemFileName);
  let subRelative = relativeImport(templateFileName, addonItemFileName);
  // ./../../../node_modules/@ember/render-modifiers/app/modifiers/did-insert
  let searchPref = "/node_modules/";
  // todo - read ember-addons property
  if (subRelative.includes("node_modules")) {
    let normalizedRelative: string = subRelative.split(searchPref)[1];
    let [group, item]: [string, string] = normalizedRelative.split("/") as any;
    let addonFolderName = group;
    if (group.startsWith("@")) {
      addonFolderName = [group, item].join("/");
    }
    let normalizedEntry = addonItemFileName
      .split(path.sep)
      .join("/")
      .split(searchPref)[0];
    let addonName = addonFolderName;
    try {
      let entry = path.join(
        normalizedEntry,
        "node_modules",
        addonFolderName,
        "index.js"
      );
      if (!fs.existsSync(entry)) {
        return null;
      }
      let item = require(entry);
      if (item.name) {
        addonName = item.name;
      }
    } catch (e) {
      console.log(e);
    }
    let imp = normalizedRelative.slice(
      normalizedRelative.indexOf(addonFolderName) + addonFolderName.length + 1,
      normalizedRelative.length
    );
    let addonImp = imp.replace("app/", "addon/");
    let maybeAddonPath = path.join(
      normalizedEntry,
      "node_modules",
      addonFolderName,
      addonImp + extname
    );
    if (fs.existsSync(maybeAddonPath)) {
      return `${addonName}/${addonImp.replace("addon/", "")}`;
    } else {
      return subRelative;
    }
  } else return subRelative;
}

export function relativeComponentImport(
  templateFileName: string,
  scriptForComponent: string
): string | null {
  return ralativeAddonImport(templateFileName, scriptForComponent);
}

export function findComponentForTemplate(fsPath, projectRoot) { 
  const extName = path.extname(fsPath);
  const componentMeta = typeForPath(projectRoot, fsPath);

  if (extName !== '.hbs' || !componentMeta) {
    // @to-do figure out this strategy
    return null;
  } 

  const server = serverForProject(projectRoot);

  const registry = server.getRegistry(projectRoot);

  let possibleScripts: string[] = [];
  if (componentMeta.kind === 'template' && componentMeta.type === 'template') {
    possibleScripts = (registry.routePath[componentMeta.name.split('/').join('.')]||[]).filter((el)=>{
      return typeForPath(projectRoot, el)?.type === 'controller';
    });
  } else {
    possibleScripts = (registry.component[componentMeta.name] || []).filter((el)=>{
      return typeForPath(projectRoot, el)?.kind === 'script'
    });
  }

  if (possibleScripts.length > 1) {
    possibleScripts = possibleScripts.filter((el)=> {
      // to-do - add support for typed-templates in addons (we need to check is it addon or not and replace scope)
      return typeForPath(projectRoot, el)?.scope === 'application';
    })
  }
  if (possibleScripts.length > 1) {
    possibleScripts = possibleScripts.filter((el)=> {
      return el.endsWith('.ts');
    })
  }

  if (possibleScripts.length === 0) {
    return null;
  }

  return possibleScripts.filter(fileLocation => fs.existsSync(fileLocation))[0];
}
