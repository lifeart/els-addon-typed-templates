"use strict";
exports.__esModule = true;
var path = require("path");
var fs = require("fs");
function virtualTemplateFileName(fsPath) {
    return path.resolve(fsPath).replace(".hbs", "_template.ts");
}
exports.virtualTemplateFileName = virtualTemplateFileName;
function relativeComponentImport(templateFileName, scriptForComponent) {
    return path
        .relative(templateFileName, scriptForComponent)
        .split(path.sep)
        .join("/")
        .replace("..", ".")
        .replace(".ts", "")
        .replace(".js", "");
}
exports.relativeComponentImport = relativeComponentImport;
function findComponentForTemplate(fsPath, projectRoot) {
    var absPath = path.resolve(fsPath);
    var fileName = path.basename(absPath, ".hbs");
    var dir = path.dirname(absPath);
    var classicComponentTemplatesLocation = "app/templates/components";
    var normalizedDirname = dir.split(path.sep).join("/");
    var fileNames = [
        fileName + ".ts",
        "component.ts",
        fileName + ".js",
        "component.js"
    ];
    var posibleNames = fileNames.map(function (name) { return path.join(dir, name); });
    var relativePath = path
        .relative(projectRoot, dir)
        .split(path.sep)
        .join("/");
    if (relativePath.startsWith(classicComponentTemplatesLocation)) {
        var pureName = normalizedDirname.split(classicComponentTemplatesLocation).pop() +
            fileName;
        posibleNames.push(path.resolve(path.join(projectRoot, "app", "components", pureName + ".ts")));
        posibleNames.push(path.resolve(path.join(projectRoot, "app", "components", pureName, "component.ts")));
        posibleNames.push(path.resolve(path.join(projectRoot, "app", "components", pureName, "index.ts")));
        posibleNames.push(path.resolve(path.join(projectRoot, "app", "components", pureName + ".js")));
        posibleNames.push(path.resolve(path.join(projectRoot, "app", "components", pureName, "component.js")));
        posibleNames.push(path.resolve(path.join(projectRoot, "app", "components", pureName, "index.js")));
    }
    return posibleNames.filter(function (fileLocation) { return fs.existsSync(fileLocation); })[0];
}
exports.findComponentForTemplate = findComponentForTemplate;
