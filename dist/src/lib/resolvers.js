"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const ts_service_1 = require("./ts-service");
function virtualTemplateFileName(fsPath) {
    const extName = path.extname(fsPath);
    return path
        .resolve(fsPath)
        .replace(extName, "--virtual-typed-template.ts");
}
exports.virtualTemplateFileName = virtualTemplateFileName;
function virtualComponentTemplateFileName(fsPath) {
    const extName = path.extname(fsPath);
    return path
        .resolve(fsPath)
        .replace(extName, "--virtual-typed-component-template.ts");
}
exports.virtualComponentTemplateFileName = virtualComponentTemplateFileName;
function relativeImport(templateFile, scriptFile) {
    return path
        .relative(templateFile, scriptFile)
        .split(path.sep)
        .join("/")
        .replace("..", ".")
        .replace(".ts", "")
        .replace(".js", "");
}
exports.relativeImport = relativeImport;
function ralativeAddonImport(templateFileName, addonItemFileName) {
    let extname = path.extname(addonItemFileName);
    let subRelative = relativeImport(templateFileName, addonItemFileName);
    // ./../../../node_modules/@ember/render-modifiers/app/modifiers/did-insert
    let searchPref = "/node_modules/";
    // todo - read ember-addons property
    if (subRelative.includes("node_modules")) {
        let normalizedRelative = subRelative.split(searchPref)[1];
        let [group, item] = normalizedRelative.split("/");
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
            let entry = path.join(normalizedEntry, "node_modules", addonFolderName, "index.js");
            if (!fs.existsSync(entry)) {
                return null;
            }
            let item = require(entry);
            if (item.name) {
                addonName = item.name;
            }
        }
        catch (e) {
            console.log(e);
        }
        let imp = normalizedRelative.slice(normalizedRelative.indexOf(addonFolderName) + addonFolderName.length + 1, normalizedRelative.length);
        let addonImp = imp.replace("app/", "addon/");
        let maybeAddonPath = path.join(normalizedEntry, "node_modules", addonFolderName, addonImp + extname);
        if (fs.existsSync(maybeAddonPath)) {
            return `${addonName}/${addonImp.replace("addon/", "")}`;
        }
        else {
            return subRelative;
        }
    }
    else
        return subRelative;
}
exports.ralativeAddonImport = ralativeAddonImport;
function relativeComponentImport(templateFileName, scriptForComponent) {
    return ralativeAddonImport(templateFileName, scriptForComponent);
}
exports.relativeComponentImport = relativeComponentImport;
function findComponentForTemplate(fsPath, projectRoot) {
    const extName = path.extname(fsPath);
    const componentMeta = ts_service_1.typeForPath(projectRoot, fsPath);
    if (extName !== '.hbs' || !componentMeta) {
        // @to-do figure out this strategy
        return null;
    }
    const server = ts_service_1.serverForProject(projectRoot);
    const registry = server.getRegistry(projectRoot);
    let possibleScripts = registry['component'][componentMeta.name].filter((el) => {
        var _a;
        return ((_a = ts_service_1.typeForPath(projectRoot, el)) === null || _a === void 0 ? void 0 : _a.kind) === 'script';
    });
    if (possibleScripts.length > 1) {
        possibleScripts = possibleScripts.filter((el) => {
            var _a;
            // to-do - add support for typed-templates in addons (we need to check is it addon or not and replace scope)
            return ((_a = ts_service_1.typeForPath(projectRoot, el)) === null || _a === void 0 ? void 0 : _a.scope) === 'application';
        });
    }
    if (possibleScripts.length > 1) {
        possibleScripts = possibleScripts.filter((el) => {
            return el.endsWith('.ts');
        });
    }
    return possibleScripts.filter(fileLocation => fs.existsSync(fileLocation))[0];
}
exports.findComponentForTemplate = findComponentForTemplate;
//# sourceMappingURL=resolvers.js.map