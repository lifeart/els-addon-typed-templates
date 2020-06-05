import { PLACEHOLDER } from "./../lib/utils";
import * as fs from "fs";
import {
    findComponentForTemplate,
    relativeComponentImport,
    ralativeAddonImport
} from "./../lib/resolvers";
import { MatchResult, typeForPath, LSRegistry } from './../lib/ts-service';
import { TypescriptTemplateBuilder } from "./../lib/hbs-converter";
import { getClassMeta } from './../lib/ast-parser';
import { Project, Server } from './../interfaces';

export default class VirtualDocumentProvider {
    builder!: TypescriptTemplateBuilder;
    constructor(private server: Server, private project: Project) { 
        this.builder = new TypescriptTemplateBuilder(server, project)
    }

    unknownComponentTemplate(meta) {
        return `export default class ${meta.className}Template {};`;
    }
    createFullVirtualTemplate(
        componentsMap,
        templatePath,
        fileName,
        uri,
        content: string | boolean = false,
        meta: MatchResult
    ) {
        const projectRoot = this.project.root;
        const server = this.server;
        const document = server.documents.get(uri);
        if (!document && !content) {
            return this.unknownComponentTemplate(meta);
        }
        const registry = "getRegistry" in server ? server.getRegistry(projectRoot) : null;
        content = content ? content : (document ? document.getText() : "");
        const { nodes, comments } = getClassMeta(content);

        let scriptForComponent = findComponentForTemplate(templatePath, this.project, (registry as unknown) as LSRegistry)
        // console.log('scriptForComponent', scriptForComponent);
        let relComponentImport: string | null = null;

        if (scriptForComponent) {
            relComponentImport = relativeComponentImport(fileName, scriptForComponent);
        }
        // console.log('scriptForComponent', scriptForComponent);
        componentsMap[fileName] = this.builder.getClass(componentsMap,
            fileName,
            { nodes, comments, meta },
            relComponentImport,
            getValidRegistryItems(registry, fileName, projectRoot)
        );
        let debug = true;
        if (debug) {
            // console.log("===============");
            fs.writeFileSync(fileName, componentsMap[fileName], "utf8");
            // console.log(componentsMap[fileName]);
            // console.log("===============");
        }
        return componentsMap[fileName];
    }

    createVirtualTemplate(
        componentsMap,
        fileName,
        { templatePath, realPath, isArg, isArrayCase, isParam }: any
    ) {
        const projectRoot = this.project.root;
        const scriptForComponent = findComponentForTemplate(
            templatePath,
            this.project,
            this.server.getRegistry(this.project.root)
        );
        let isTemplateOnly = false;
        let relComponentImport: any = undefined;
        let className = 'Template';

        const meta = typeForPath(projectRoot, templatePath);
        if (meta) {
            className = meta.className + 'Template';
        }

        if (!scriptForComponent) {
            isTemplateOnly = true;
        } else {
            relComponentImport = relativeComponentImport(fileName, scriptForComponent);
        }

        componentsMap[fileName] = this.getBasicComponent(realPath, {
            relComponentImport,
            isArg,
            isParam,
            className,
            isTemplateOnly,
            isArrayCase
        });
        let posStart = this.getBasicComponent(PLACEHOLDER, {
            relComponentImport,
            isParam,
            className,
            isTemplateOnly,
            isArrayCase,
            isArg
        }).indexOf(PLACEHOLDER);
        let pos = posStart + realPath.length;
        return { pos, posStart };
    }

    private getBasicComponent(pathExp = PLACEHOLDER, flags: any = {}) {
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

function normalizePath(name: string) {
    return name.split('\\').join('/');
}

function getValidRegistryItems(registry: any, templateFile: string, projectRoot: string) {
    const items: any = {};
    if (!projectRoot) {
        return items;
    }
    if (registry === null) {
        return items;
    } else {
        fs.writeFileSync(projectRoot + '/registry.json', JSON.stringify(registry), 'utf8');
        const keys = ["helper", "modifier"];
        keys.forEach(keyName => {
            Object.keys(registry[keyName]).forEach(name => {
                const itemPaths = registry[keyName][name].filter(
                    p => !p.endsWith(".hbs") && !normalizePath(name).includes('/tests/') && !normalizePath(name).includes('/dist/')
                );
                let primaryPath = itemPaths.find(p => p.endsWith(".ts"));
                if (primaryPath) {
                    items[name] = ralativeAddonImport(templateFile, primaryPath);
                } else {
                    if (itemPaths.length) {
                        items[name] = ralativeAddonImport(templateFile, itemPaths.sort()[0]);
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
                const componentScripts = registry[keyName][name].filter(
                    p => !p.endsWith(".hbs") && !normalizePath(p).includes('/tests/') && !normalizePath(p).includes('/dist/')
                ).sort();
                const hasScriptTs = componentScripts.find(name => name.endsWith('.ts'));
                const hasScriptJs = componentScripts.find(name => name.endsWith('.js'));
                const hasAddonTs = componentScripts.find(name => name.endsWith('.ts') && normalizePath(name).includes('/addon/'));
                const hasAddonJs = componentScripts.find(name => name.endsWith('.js') && normalizePath(name).includes('/addon/'));
                if (hasScriptHbs) {
                    items[name] = {
                        template: hasScriptHbs,
                        script: hasAddonTs || hasAddonJs || hasScriptTs || hasScriptJs || null
                    }
                } else {
                    items[name] = {
                        template: null,
                        script: hasAddonTs || hasAddonJs || hasScriptTs || hasScriptJs || null
                    }
                }

            });
        });
    }
    return items;
}



