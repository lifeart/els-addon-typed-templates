import * as path from "path";
import * as fs from "fs";

export function virtualTemplateFileName(fsPath) {
  const extName = path.extname(fsPath);
  return path
    .resolve(fsPath)
    .replace(extName, "_" + "_typed_template.ts");
}

export function virtualComponentTemplateFileName(fsPath) {
  const extName = path.extname(fsPath);
  return path
    .resolve(fsPath)
    .replace(extName, "_" + "_typed_component_template.ts");
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
): string {
  return ralativeAddonImport(templateFileName, scriptForComponent);
}

export function findComponentForTemplate(fsPath, projectRoot) {
  const extName = path.extname(fsPath);
  if (extName !== '.hbs') {
    return fsPath;
  }
  const absPath = path.resolve(fsPath);
  const fileName = path.basename(absPath, extName);
  const dir = path.dirname(absPath);
  const classicComponentTemplatesLocation = "app/templates/components";
  const normalizedDirname = dir.split(path.sep).join("/");
  const fileNames = [
    fileName + ".ts",
    fileName + ".js",
    "component.ts",
    "component.js"
  ];
  const relativePath = path
  .relative(projectRoot, dir)
  .split(path.sep)
  .join("/");
  if (!relativePath.startsWith(classicComponentTemplatesLocation) && fileName === 'template') {
    fileNames.push('controller.ts');
    fileNames.push('controller.js');
  }
  const posibleNames = fileNames.map(name => path.join(dir, name));
 
  if (relativePath.startsWith(classicComponentTemplatesLocation)) {
    const pureName =
      normalizedDirname.split(classicComponentTemplatesLocation).pop() +
      fileName;
    posibleNames.push(
      path.resolve(
        path.join(projectRoot, "app", "components", pureName + ".ts")
      )
    );
    posibleNames.push(
      path.resolve(
        path.join(projectRoot, "app", "components", pureName + ".js")
      )
    );
    posibleNames.push(
      path.resolve(
        path.join(projectRoot, "app", "components", pureName, "index.ts")
      )
    );

    posibleNames.push(
      path.resolve(
        path.join(projectRoot, "app", "components", pureName, "index.js")
      )
    );
    posibleNames.push(
      path.resolve(
        path.join(projectRoot, "app", "components", pureName, "component.ts")
      )
    );

    posibleNames.push(
      path.resolve(
        path.join(projectRoot, "app", "components", pureName, "component.js")
      )
    );
  }

  // console.log('possibleComponentNames', posibleNames);
  return posibleNames.filter(fileLocation => fs.existsSync(fileLocation))[0];
}
