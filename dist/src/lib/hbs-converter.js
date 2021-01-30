"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypescriptTemplateBuilder = void 0;
const utils_1 = require("./utils");
const logger_1 = require("./logger");
const camelcase = require("camelcase");
const fs = require("fs");
const resolvers_1 = require("./resolvers");
const ast_parser_1 = require("./ast-parser");
const hbs_extractor_1 = require("./hbs-extractor");
const ts_service_1 = require("./ts-service");
const hbs_transform_1 = require("./hbs-transform");
const default_scopes_1 = require("./default-scopes");
const BUILTIN_GLOBAL_SCOPE = [
    'mut', 'fn', 'action',
    'if', 'else', 'outlet', 'yield', '-in-element', 'in-element',
    'each-in', 'each',
    'log', 'debugger',
    'input', 'textarea', 'component',
    'unbound', 'let', 'with', 'loc', 'hash', 'array',
    'query-params',
    'v-get',
    'identity',
    'has-block',
    'render-inverse',
    'link-to',
    'in-unless',
    'unless',
    'get', 'concat',
    'readonly',
    'action',
    'hasBlock',
    'hasBlockParams',
    'mount',
    'on',
    'partial'
];
function commentForNode(rawPos, comments) {
    let pos = parseInt(rawPos.split(':')[0].split(',')[0], 10);
    let comment = comments.find(([commentPos]) => commentPos === pos);
    if (comment && comment[1].includes(' Args') && comment[1].includes('interface ')) {
        return '';
    }
    if (comment) {
        let value = comment[1].trim();
        return (value.includes('//') || value.includes('/*')) ? value : '// ' + value;
    }
    else {
        return '';
    }
}
function declaredInScope(name, resolvedScope) {
    if (BUILTIN_GLOBAL_SCOPE.includes(name)) {
        return true;
    }
    if (name in resolvedScope) {
        return true;
    }
    return false;
}
function importNameForItem(item) {
    return ("TemplateImported_" +
        camelcase(item, { pascalCase: true })
            .split("/")
            .join("_"));
}
class TypescriptTemplate {
    constructor(builder, project, { componentsMap, fileName, globalRegistry, depth, parents, scopes, klass, globalScope, tailForGlobalScope, pathsForGlobalScope, definedScope, componentImport, comments, meta, componentsForImport, blockPaths }) {
        this.builder = builder;
        this.project = project;
        this.yields = [];
        this.imports = [];
        this.builtinImports = [];
        this.componentsForImport = componentsForImport;
        this.blockPaths = blockPaths;
        this.meta = meta;
        this.comments = comments;
        this.componentImport = componentImport;
        this.definedScope = definedScope;
        this.globalScope = globalScope;
        this.tailForGlobalScope = tailForGlobalScope;
        this.pathsForGlobalScope = pathsForGlobalScope;
        this.klass = klass;
        this.parents = parents;
        this.scopes = scopes;
        this.depth = depth;
        this.fileName = fileName;
        this.componentsMap = componentsMap;
        this.globalRegistry = globalRegistry;
        this.addImport = this.addImport.bind(this);
        this.addComponentImport = this.addComponentImport.bind(this);
        this.getItemScopes = this.getItemScopes.bind(this);
        this.getPathScopes = this.getPathScopes.bind(this);
    }
    getPathScopes(node, key) {
        const scopeChain = node.original.replace(utils_1.PLACEHOLDER, "").split(".");
        const scopeKey = scopeChain.shift();
        const itemScopes = this.getItemScopes(key);
        let foundKey = "globalScope";
        for (let i = 0; i < itemScopes.length; i++) {
            let index = itemScopes[i][1].indexOf(scopeKey);
            if (index > -1) {
                foundKey = [itemScopes[i][0], index];
                break;
            }
        }
        return {
            scopeKey,
            scopeChain,
            foundKey
        };
    }
    getItemScopes(key, itemScopes = []) {
        let p = Object.keys(this.parents);
        let parent = null;
        p.forEach(pid => {
            if (pid !== key && this.parents[pid].includes(key)) {
                parent = pid;
            }
        });
        if (parent) {
            itemScopes.push([parent, this.scopes[parent] || []]);
            return this.getItemScopes(parent, itemScopes);
        }
        return itemScopes;
    }
    addImport(name, filePath) {
        // @to-do implement more elegant fix for mustache components, like `{{foo-bar}}`
        // issue from hbs-transform addImport(scopeKey, globalRegistry[scopeKey]);
        if (typeof filePath !== 'string') {
            return;
        }
        this.imports.push(`import ${importNameForItem(name)} from "${filePath}";`);
    }
    process() {
        const tokensToProcess = Object.keys(this.klass).sort();
        const pathTokens = tokensToProcess.filter((name) => name.includes('PathExpression'));
        const otherTokens = tokensToProcess.filter((name) => !pathTokens.includes(name));
        let builtinImports = this.builtinImports;
        pathTokens.forEach((key) => {
            let node = this.klass[key];
            const { result, simpleResult, builtinScopeImports } = hbs_transform_1.transformPathExpression(node, key, {
                yields: this.yields,
                importNameForItem,
                componentImport: this.componentImport,
                getPathScopes: this.getPathScopes,
                globalScope: this.globalScope,
                declaredInScope: (name) => {
                    return declaredInScope(name, this.globalRegistry);
                },
                blockPaths: this.blockPaths,
                globalRegistry: this.globalRegistry,
                tailForGlobalScope: this.tailForGlobalScope,
                getItemScopes: this.getItemScopes,
                addComponentImport: this.addComponentImport,
                pathsForGlobalScope: this.pathsForGlobalScope,
                addImport: this.addImport,
                componentsForImport: this.componentsForImport
            });
            this.klass[key] = result;
            builtinScopeImports.forEach((name) => {
                if (!builtinImports.includes(name)) {
                    builtinImports.push(name);
                }
            });
            this.klass[key + '_simple'] = simpleResult;
        });
        otherTokens.forEach(key => {
            let node = this.klass[key];
            if (hbs_transform_1.transform.support(node)) {
                this.klass[key] = hbs_transform_1.transform.transform(node, key, this.klass);
            }
        });
    }
    addComponentImport(name, filePath) {
        if (filePath.template) {
            let virtualFileName = resolvers_1.virtualComponentTemplateFileName(filePath.template);
            this.builder.registerTemplateKlassForFile(this.componentsMap, this.globalRegistry, virtualFileName, filePath.template, filePath.script, this.depth - 1, this.project.root);
            // todo - we need to resolve proper template and compile it :)
            this.addImport(name, resolvers_1.relativeImport(this.fileName, virtualFileName));
        }
        else if (filePath.script) {
            // todo - we need to resolve proper template and compile it :)
            this.addImport(name, resolvers_1.relativeImport(this.fileName, filePath.script));
        }
        else {
            this.imports.push(`class ${importNameForItem(name)} { args: any; defaultYield() { return []; } };`);
        }
    }
}
class TypescriptTemplateBuilder {
    constructor(server, project) {
        this.server = server;
        this.project = project;
    }
    registerTemplateKlassForFile(componentsMap, registry, virtualFileName, templateFileName, scriptFileName, depth, projectRoot) {
        let klass = `
    export default EmptyKlass {
      args: any;
      defaultYield() { return []; };
    };
    `;
        try {
            let source = fs.readFileSync(templateFileName, "utf8");
            const meta = ts_service_1.typeForPath(projectRoot, templateFileName);
            const { nodes, comments } = ast_parser_1.getClassMeta(source);
            klass = this.getClass(componentsMap, virtualFileName, { nodes, comments, meta }, scriptFileName ? resolvers_1.relativeImport(templateFileName, scriptFileName) : null, registry, depth);
        }
        catch (e) {
            if (this.server) {
                console.log(e);
            }
        }
        logger_1.withDebug(() => {
            console.log("--------------------------");
            console.log(virtualFileName);
            console.log("--------------------------");
            console.log(klass);
            console.log("--------------------------");
        });
        componentsMap[virtualFileName] = klass;
    }
    emptyTemplate(meta) {
        return `export default class ${meta.className}UnreachedComponent { args: any; defaultYield() { return []; } };`;
    }
    getClass(componentsMap, fileName, { nodes, comments, meta }, componentImport, globalRegistry, depth = 5) {
        const items = nodes;
        if (depth < 0) {
            return this.emptyTemplate(meta);
        }
        const { componentsForImport, parents, scopes, klass, blockPaths } = hbs_extractor_1.extractRelationships(items, this.project.root);
        const { globalScope, tailForGlobalScope, pathsForGlobalScope, definedScope } = default_scopes_1.defaultScopes();
        const template = new TypescriptTemplate(this, this.project, {
            componentsMap, fileName, globalRegistry, depth, parents, scopes, klass,
            globalScope, tailForGlobalScope, pathsForGlobalScope, definedScope,
            componentImport, comments, meta, componentsForImport, blockPaths
        });
        template.process();
        return this.makeClass(template);
    }
    hasNoCheck(comments) {
        return comments.find(([_, el]) => el.includes('@ts-nocheck'));
    }
    hasArgsTypings(comments) {
        return comments.find(([_, el]) => el.includes('interface Args'));
    }
    isTemplateOnlyComponent(componentImport) {
        return !componentImport;
    }
    componentKlassImport(componentImport) {
        return componentImport
            ? `import Component from "${componentImport}";`
            : '';
    }
    templateComponentDeclaration(componentImport, meta) {
        return componentImport
            ? `export default class ${meta.className}Template extends Component`
            : `export default class ${meta.className}TemplateOnlyComponent`;
    }
    componentExtraProperties(componentImport, hasArgsTypings) {
        return componentImport && !hasArgsTypings
            ? ""
            : `
    args: ${hasArgsTypings ? 'Args' : 'any'};
  `;
    }
    builtinImportsTemplate(builtinImports) {
        return `import { ${builtinImports.join(', ')} } from "ember-typed-templates";`;
    }
    templateScopeRegistryTemplate(globalScope, definedScope) {
        return Object.keys(globalScope)
            .filter((key) => !(key in definedScope))
            .map(key => {
            return `  ["${key}"]:${globalScope[key]};`;
        })
            .join("\n");
    }
    templateImportsTemplate(imports) {
        return Array.from(new Set(imports)).join("\n");
    }
    noCheckTemplate(hasNocheck) {
        return hasNocheck ? '// @ts-nocheck' : '';
    }
    defaultYieldBodyTemplate(yields) {
        return `return ${yields.length ? `this['${yields[0]}']()` : "[]"};`;
    }
    klassFieldsTemplate(klass, comments) {
        return Object.keys(klass).filter((name) => !name.endsWith('_simple'))
            .map(key => {
            return `${commentForNode(serializeKey(key), comments)}
//@mark [${serializeKey(key)}]
"${key}"${klass[key]};`;
        }).join("\n");
    }
    maybeArgTypingsTemplate(hasArgsTypings) {
        return hasArgsTypings ? hasArgsTypings[1] : '';
    }
    templateOnlyComponentConstructorTemplate(isTemplateOnlyComponent, hasArgsTypings) {
        return isTemplateOnlyComponent ? `constructor(owner:unknown, args: ${hasArgsTypings ? 'Args' : 'any'}) { this.args = args; }` : '';
    }
    makeClass({ meta, builtinImports, imports, yields, klass, comments, componentImport, globalScope, definedScope }) {
        builtinImports.push('GlobalRegistry');
        const hasArgsTypings = this.hasArgsTypings(comments);
        const isTemplateOnlyComponent = this.isTemplateOnlyComponent(componentImport);
        const componentKlassImport = this.componentKlassImport(componentImport);
        const templateComponentDeclaration = this.templateComponentDeclaration(componentImport, meta);
        const componentExtraProperties = this.componentExtraProperties(componentImport, hasArgsTypings);
        const templateScopeRegistry = this.templateScopeRegistryTemplate(globalScope, definedScope);
        const templateImports = this.templateImportsTemplate(imports);
        const builtinImportsTemplate = this.builtinImportsTemplate(builtinImports);
        const extraComment = this.noCheckTemplate(this.hasNoCheck(comments));
        const defaultYieldBody = this.defaultYieldBodyTemplate(yields);
        const klassFields = this.klassFieldsTemplate(klass, comments);
        const maybeArgTypings = this.maybeArgTypingsTemplate(hasArgsTypings);
        const templateOnlyComponentConstructor = this.templateOnlyComponentConstructorTemplate(isTemplateOnlyComponent, hasArgsTypings);
        const klssTpl = `
  
  ${extraComment}
  ${componentKlassImport}
  ${templateImports}
  ${builtinImportsTemplate}

  interface TemplateScopeRegistry {
    ${templateScopeRegistry}
  }
  
  type Modify<T, R> = Omit<T, keyof R> & R;
  
  type EmberTemplateScopeRegistry = Modify<TemplateScopeRegistry, GlobalRegistry>;
  
  ${maybeArgTypings}
  
  ${templateComponentDeclaration} {
    ${componentExtraProperties}
    ${templateOnlyComponentConstructor}
    globalScope:  EmberTemplateScopeRegistry;
    defaultYield() {
      ${defaultYieldBody}
    }
    //@mark-meaningful-issues-start
    ${klassFields}
  }
      
  `;
        return klssTpl.trim();
    }
}
exports.TypescriptTemplateBuilder = TypescriptTemplateBuilder;
function serializeKey(key) {
    return key.split(" - ")[0];
}
//# sourceMappingURL=hbs-converter.js.map