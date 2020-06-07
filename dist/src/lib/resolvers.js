"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const ts_service_1 = require("./ts-service");
const utils_1 = require("./utils");
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
        .replace(".d.ts", "")
        .replace(".ts", "")
        .replace(".js", "");
}
exports.relativeImport = relativeImport;
function relativeAddonImport(templateFileName, addonItemFileName) {
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
exports.relativeAddonImport = relativeAddonImport;
function relativeComponentImport(templateFileName, scriptForComponent) {
    return relativeAddonImport(templateFileName, scriptForComponent);
}
exports.relativeComponentImport = relativeComponentImport;
function findComponentForTemplate(fsPath, project, registry) {
    const extName = path.extname(fsPath);
    const componentMeta = ts_service_1.matchPathToType(project, fsPath);
    if (!utils_1.isHBS(extName) || !componentMeta) {
        // @to-do figure out this strategy
        return null;
    }
    let possibleScripts = [];
    if (componentMeta.kind === 'template' && componentMeta.type === 'template') {
        possibleScripts = (registry.routePath[componentMeta.name.split('/').join('.')] || []).filter((el) => {
            let meta = ts_service_1.matchPathToType(project, el);
            if (!meta) {
                return null;
            }
            return meta.type === 'controller' && meta.kind === 'script';
        });
    }
    else {
        possibleScripts = (registry.component[componentMeta.name] || []).filter((el) => {
            let meta = ts_service_1.matchPathToType(project, el);
            return meta && meta.kind === 'script';
        });
    }
    if (possibleScripts.length > 1) {
        possibleScripts = possibleScripts.filter((el) => {
            let meta = ts_service_1.matchPathToType(project, el);
            // to-do - add support for typed-templates in addons (we need to check is it addon or not and replace scope)
            return meta && meta.scope === 'application';
        });
    }
    if (possibleScripts.length > 1) {
        possibleScripts = possibleScripts.filter((el) => {
            return el.endsWith('.ts');
        });
    }
    if (possibleScripts.length === 0) {
        return null;
    }
    return possibleScripts.filter(fileLocation => fs.existsSync(fileLocation))[0];
}
exports.findComponentForTemplate = findComponentForTemplate;
//# sourceMappingURL=resolvers.js.map