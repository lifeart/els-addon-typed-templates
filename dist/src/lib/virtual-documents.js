"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
// import * as fs from "fs";
const resolvers_1 = require("./resolvers");
const ts_service_1 = require("./ts-service");
const hbs_converter_1 = require("./hbs-converter");
const ast_parser_1 = require("./ast-parser");
// function yieldedContext() {
//   return `
//   _template_BlockStatement_Each_FirstBlock() {
//     return this._template_PathExpresion()[0];
//   }
//   `;
// }
function normalizePath(name) {
    return name.split('\\').join('/');
}
function getValidRegistryItems(registry, templateFile, projectRoot) {
    const items = {};
    if (!projectRoot) {
        return items;
    }
    if (registry === null) {
        return items;
    }
    else {
        const keys = ["helper", "modifier"];
        keys.forEach(keyName => {
            Object.keys(registry[keyName]).forEach(name => {
                const itemPaths = registry[keyName][name].filter(p => !p.endsWith(".hbs"));
                let primaryPath = itemPaths.find(p => p.endsWith(".ts"));
                if (primaryPath) {
                    items[name] = resolvers_1.ralativeAddonImport(templateFile, primaryPath);
                }
                else {
                    if (itemPaths.length) {
                        items[name] = resolvers_1.ralativeAddonImport(templateFile, itemPaths.sort()[0]);
                    }
                }
                if (items[name] === null) {
                    delete items[name];
                }
            });
        });
        const componentKeys = ["component"];
        componentKeys.forEach(keyName => {
            // @to-do - fix this creepy stuff
            Object.keys(registry[keyName]).forEach(name => {
                const hasScriptHbs = registry[keyName][name].find(name => name.endsWith('.hbs'));
                const componentScripts = registry[keyName][name].filter(p => !p.endsWith(".hbs") && !normalizePath(p).includes('/tests/') && !normalizePath(p).includes('/dist/')).sort();
                const hasScriptTs = componentScripts.find(name => name.endsWith('.ts'));
                const hasScriptJs = componentScripts.find(name => name.endsWith('.js'));
                const hasAddonTs = componentScripts.find(name => name.endsWith('.ts') && normalizePath(name).includes('/addon/'));
                const hasAddonJs = componentScripts.find(name => name.endsWith('.js') && normalizePath(name).includes('/addon/'));
                if (hasScriptHbs) {
                    items[name] = {
                        template: hasScriptHbs,
                        script: hasAddonTs || hasAddonJs || hasScriptTs || hasScriptJs || null
                    };
                }
                else {
                    items[name] = {
                        template: null,
                        script: hasAddonTs || hasAddonJs || hasScriptTs || hasScriptJs || null
                    };
                }
            });
        });
    }
    return items;
}
function createFullVirtualTemplate(projectRoot, componentsMap, templatePath, fileName, server, uri, content = false, meta) {
    const document = server.documents.get(uri);
    if (!document && !content) {
        return `export default class ${meta.className}Template {};`;
    }
    const registry = "getRegistry" in server ? server.getRegistry(projectRoot) : null;
    content = content ? content : document.getText();
    const { nodes, comments } = ast_parser_1.getClassMeta(content);
    let scriptForComponent = resolvers_1.findComponentForTemplate(templatePath, projectRoot);
    // console.log('scriptForComponent', scriptForComponent);
    let relComponentImport = null;
    if (scriptForComponent) {
        relComponentImport = resolvers_1.relativeComponentImport(fileName, scriptForComponent);
    }
    // console.log('scriptForComponent', scriptForComponent);
    componentsMap[fileName] = hbs_converter_1.getClass(componentsMap, fileName, { nodes, comments, projectRoot, meta }, relComponentImport, getValidRegistryItems(registry, fileName, projectRoot));
    let debug = true;
    if (debug) {
        console.log("===============");
        console.log(componentsMap[fileName]);
        console.log("===============");
    }
    return componentsMap[fileName];
}
exports.createFullVirtualTemplate = createFullVirtualTemplate;
function createVirtualTemplate(projectRoot, componentsMap, fileName, { templatePath, realPath, isArg, isArrayCase, isParam }) {
    const scriptForComponent = resolvers_1.findComponentForTemplate(templatePath, projectRoot);
    let isTemplateOnly = false;
    let relComponentImport = undefined;
    let className = 'Template';
    const meta = ts_service_1.typeForPath(projectRoot, templatePath);
    if (meta) {
        className = meta.className + 'Template';
    }
    if (!scriptForComponent) {
        isTemplateOnly = true;
    }
    else {
        relComponentImport = resolvers_1.relativeComponentImport(fileName, scriptForComponent);
    }
    componentsMap[fileName] = getBasicComponent(realPath, {
        relComponentImport,
        isArg,
        isParam,
        className,
        isTemplateOnly,
        isArrayCase
    });
    let posStart = getBasicComponent(utils_1.PLACEHOLDER, {
        relComponentImport,
        isParam,
        className,
        isTemplateOnly,
        isArrayCase,
        isArg
    }).indexOf(utils_1.PLACEHOLDER);
    let pos = posStart + realPath.length;
    return { pos, posStart };
}
exports.createVirtualTemplate = createVirtualTemplate;
function getBasicComponent(pathExp = utils_1.PLACEHOLDER, flags = {}) {
    let outputType = "string | number | void";
    let relImport = flags.relComponentImport || "./component";
    let templateOnly = "";
    let className = "Template";
    if (flags.className) {
        className = flags.className;
    }
    if (flags.isTemplateOnly) {
        templateOnly = "args: any;";
    }
    if (flags.isArrayCase) {
        outputType = "any[]";
    }
    if (flags.isParam) {
        outputType = "any";
    }
    if (flags.isTemplateOnly) {
        return [
            `export default class ${className} {`,
            `constructor(owner, args) {
        this.args = args;
      };`,
            templateOnly,
            `_template_PathExpresion(): ${outputType} {`,
            "return " + pathExp,
            "}",
            "}"
        ].join("");
    }
    return [
        `import Component from "${relImport}";`,
        `export default class ${className} extends Component {`,
        templateOnly,
        `_template_PathExpresion(): ${outputType} {`,
        "return " + pathExp,
        "}",
        "}"
    ].join("");
}
exports.getBasicComponent = getBasicComponent;
//# sourceMappingURL=virtual-documents.js.map