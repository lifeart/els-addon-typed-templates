import * as path from "path";
import * as fs from "fs";

export function virtualTemplateFileName(fsPath) {
  return path.resolve(fsPath).replace(".hbs", '_' + Date.now() + "_template.ts");
}

export function virtualComponentTemplateFileName(fsPath) {
  return path.resolve(fsPath).replace(".hbs", '_' + Date.now() + "_component_template.ts");
}

export function relativeImport(templateFile, scriptFile) {
  return path
    .relative(templateFile, scriptFile)
    .split(path.sep)
    .join("/")
    .replace("..", ".").replace(".ts", "")
    .replace(".js", "");
}

export function relativeComponentImport(templateFileName: string, scriptForComponent: string): string {
  return relativeImport(templateFileName, scriptForComponent);
}

export function findComponentForTemplate(fsPath, projectRoot) {
  const absPath = path.resolve(fsPath);
  const fileName = path.basename(absPath, ".hbs");
  const dir = path.dirname(absPath);
  const classicComponentTemplatesLocation = "app/templates/components";
  const normalizedDirname = dir.split(path.sep).join("/");
  const fileNames = [
    fileName + ".ts",
    fileName + ".js",
    "component.ts",
    "component.js"
  ];
  const posibleNames = fileNames.map(name => path.join(dir, name));
  const relativePath = path
    .relative(projectRoot, dir)
    .split(path.sep)
    .join("/");
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
