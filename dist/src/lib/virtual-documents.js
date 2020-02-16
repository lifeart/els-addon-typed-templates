"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
// import * as fs from "fs";
const resolvers_1 = require("./resolvers");
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
function getValidRegistryItems(registry, templateFile) {
    const items = {};
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
            Object.keys(registry[keyName]).forEach(name => {
                const hasScriptHbs = registry[keyName][name].find(name => name.endsWith('.hbs'));
                const componentScripts = registry[keyName][name].filter(p => !p.endsWith(".hbs") && !p.includes('/tests/') && !p.includes('/dist/')).sort();
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
function createFullVirtualTemplate(projectRoot, componentsMap, templatePath, fileName, server, uri, content = false) {
    const document = server.documents.get(uri);
    if (!document && !content) {
        return `export default class Template {};`;
    }
    const registry = "getRegistry" in server ? server.getRegistry(projectRoot) : null;
    content = content ? content : document.getText();
    const { nodes, comments } = ast_parser_1.getClassMeta(content);
    const scriptForComponent = resolvers_1.findComponentForTemplate(templatePath, projectRoot);
    let relComponentImport = null;
    if (scriptForComponent) {
        relComponentImport = resolvers_1.relativeComponentImport(fileName, scriptForComponent);
    }
    // console.log('scriptForComponent', scriptForComponent);
    componentsMap[fileName] = hbs_converter_1.getClass(componentsMap, fileName, { nodes, comments }, relComponentImport, getValidRegistryItems(registry, fileName));
    console.log("===============");
    console.log(componentsMap[fileName]);
    console.log("===============");
    return componentsMap[fileName];
}
exports.createFullVirtualTemplate = createFullVirtualTemplate;
function createVirtualTemplate(projectRoot, componentsMap, fileName, { templatePath, realPath, isArg, isArrayCase, isParam }) {
    // console.log('createVirtualTemplate')
    const scriptForComponent = resolvers_1.findComponentForTemplate(templatePath, projectRoot);
    let isTemplateOnly = false;
    let relComponentImport = undefined;
    if (!scriptForComponent) {
        isTemplateOnly = true;
    }
    else {
        relComponentImport = resolvers_1.relativeComponentImport(fileName, scriptForComponent);
    }
    // console.log('scriptForComponent', scriptForComponent)
    // console.log('relComponentImport', relComponentImport)
    // componentsMap[scriptForComponent] = fs.readFileSync(
    //   scriptForComponent,
    //   "utf8"
    // );
    // console.log('fileName', fileName)
    componentsMap[fileName] = getBasicComponent(realPath, {
        relComponentImport,
        isArg,
        isParam,
        isTemplateOnly,
        isArrayCase
    });
    let posStart = getBasicComponent(utils_1.PLACEHOLDER, {
        relComponentImport,
        isParam,
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
    if (flags.isTemplateOnly) {
        templateOnly = "args: any;";
    }
    if (flags.isArrayCase) {
        outputType = "any[]";
    }
    if (flags.isParam) {
        outputType = "any";
    }
    return [
        `import Component from "${relImport}";`,
        "export default class Template extends Component {",
        templateOnly,
        `_template_PathExpresion(): ${outputType} {`,
        "return " + pathExp,
        "}",
        "}"
    ].join("");
}
exports.getBasicComponent = getBasicComponent;
//# sourceMappingURL=virtual-documents.js.map