"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./../lib/utils");
const fs = require("fs");
const logger_1 = require("../lib/logger");
const resolvers_1 = require("./../lib/resolvers");
const ts_service_1 = require("./../lib/ts-service");
const hbs_converter_1 = require("./../lib/hbs-converter");
const ast_parser_1 = require("./../lib/ast-parser");
class VirtualDocumentProvider {
    constructor(server, project) {
        this.server = server;
        this.project = project;
        this.builder = new hbs_converter_1.TypescriptTemplateBuilder(server, project);
    }
    unknownComponentTemplate(meta) {
        return `export default class ${meta.className}Template {};`;
    }
    createFullVirtualTemplate(componentsMap, templatePath, fileName, uri, content = false, meta) {
        const projectRoot = this.project.root;
        const server = this.server;
        const document = server.documents.get(uri);
        if (!document && !content) {
            if (fs.existsSync(templatePath)) {
                content = fs.readFileSync(templatePath, 'utf8');
            }
            else {
                return this.unknownComponentTemplate(meta);
            }
        }
        const registry = "getRegistry" in server ? server.getRegistry(projectRoot) : null;
        content = content ? content : (document ? document.getText() : "");
        const { nodes, comments } = ast_parser_1.getClassMeta(content);
        let scriptForComponent = resolvers_1.findComponentForTemplate(templatePath, this.project, registry);
        // console.log('scriptForComponent', scriptForComponent);
        let relComponentImport = null;
        if (scriptForComponent) {
            relComponentImport = resolvers_1.relativeComponentImport(fileName, scriptForComponent);
        }
        // console.log('scriptForComponent', scriptForComponent);
        componentsMap[fileName] = this.builder.getClass(componentsMap, fileName, { nodes, comments, meta }, relComponentImport, getValidRegistryItems(registry, fileName, projectRoot));
        logger_1.withDebug(() => {
            console.log("===============");
            fs.writeFileSync(fileName, componentsMap[fileName], "utf8");
            console.log(fileName);
            console.log("===============");
        });
        return componentsMap[fileName];
    }
    createVirtualTemplate(componentsMap, fileName, { templatePath, realPath, isArg, isArrayCase, isParam }) {
        const projectRoot = this.project.root;
        const scriptForComponent = resolvers_1.findComponentForTemplate(templatePath, this.project, this.server.getRegistry(this.project.root));
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
        componentsMap[fileName] = this.getBasicComponent(realPath, {
            relComponentImport,
            isArg,
            isParam,
            className,
            isTemplateOnly,
            isArrayCase
        });
        let posStart = this.getBasicComponent(utils_1.PLACEHOLDER, {
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
    getBasicComponent(pathExp = utils_1.PLACEHOLDER, flags = {}) {
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
}
exports.default = VirtualDocumentProvider;
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
        logger_1.withDebug(() => {
            fs.writeFileSync(projectRoot + '/registry.json', JSON.stringify(registry), 'utf8');
        });
        const keys = ["helper", "modifier"];
        keys.forEach(keyName => {
            Object.keys(registry[keyName]).forEach(name => {
                const itemPaths = registry[keyName][name].filter(p => !utils_1.isHBS(p) && !normalizePath(name).includes('/tests/') && !normalizePath(name).includes('/dist/'));
                let primaryPath = itemPaths.find(p => utils_1.isTS(p));
                if (primaryPath) {
                    items[name] = resolvers_1.relativeAddonImport(templateFile, primaryPath);
                }
                else {
                    if (itemPaths.length) {
                        items[name] = resolvers_1.relativeAddonImport(templateFile, itemPaths.sort()[0]);
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
                const hasScriptHbs = registry[keyName][name].find(name => utils_1.isHBS(name));
                const componentScripts = registry[keyName][name].filter(p => !utils_1.isHBS(p) && !normalizePath(p).includes('/tests/') && !normalizePath(p).includes('/dist/')).sort();
                const hasScriptTs = componentScripts.find(name => utils_1.isTS(name));
                const hasScriptJs = componentScripts.find(name => utils_1.isJS(name));
                const hasAddonTs = componentScripts.find(name => utils_1.isTS(name) && normalizePath(name).includes('/addon/'));
                const hasAddonJs = componentScripts.find(name => utils_1.isJS(name) && normalizePath(name).includes('/addon/'));
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
//# sourceMappingURL=virtual-document.js.map