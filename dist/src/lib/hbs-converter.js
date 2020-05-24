"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const camelcase = require("camelcase");
const fs = require("fs");
const resolvers_1 = require("./resolvers");
const ast_parser_1 = require("./ast-parser");
const hbs_extractor_1 = require("./hbs-extractor");
const ts_service_1 = require("./ts-service");
const hbs_transform_1 = require("./hbs-transform");
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
function registerTemplateKlassForFile(componentsMap, registry, virtualFileName, templateFileName, scriptFileName, depth, projectRoot) {
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
        klass = getClass(componentsMap, virtualFileName, { nodes, comments, projectRoot, meta }, scriptFileName ? resolvers_1.relativeImport(templateFileName, scriptFileName) : null, registry, depth);
    }
    catch (e) {
        console.log(e);
    }
    let debug = false;
    if (debug) {
        console.log("--------------------------");
        console.log(virtualFileName);
        console.log("--------------------------");
        console.log(klass);
        console.log("--------------------------");
    }
    componentsMap[virtualFileName] = klass;
}
function getClass(componentsMap, fileName, { nodes, comments, projectRoot, meta }, componentImport, globalRegistry, depth = 5) {
    const yields = [];
    const imports = [];
    const items = nodes;
    if (depth < 0) {
        return `export default class ${meta.className}UnreachedComponent { args: any; defaultYield() { return []; } };`;
    }
    function addImport(name, filePath) {
        // @to-do implement more elegant fix for mustache components, like `{{foo-bar}}`
        // issue from hbs-transform addImport(scopeKey, globalRegistry[scopeKey]);
        if (typeof filePath !== 'string') {
            return;
        }
        imports.push(`import ${importNameForItem(name)} from "${filePath}";`);
    }
    function addComponentImport(name, filePath) {
        if (filePath.template) {
            let virtualFileName = resolvers_1.virtualComponentTemplateFileName(filePath.template);
            registerTemplateKlassForFile(componentsMap, globalRegistry, virtualFileName, filePath.template, filePath.script, depth - 1, projectRoot);
            // todo - we need to resolve proper template and compile it :)
            addImport(name, resolvers_1.relativeImport(fileName, virtualFileName));
        }
        else if (filePath.script) {
            // todo - we need to resolve proper template and compile it :)
            addImport(name, resolvers_1.relativeImport(fileName, filePath.script));
        }
        else {
            imports.push(`class ${importNameForItem(name)} { args: any; defaultYield() { return []; } };`);
        }
    }
    const { componentsForImport, parents, scopes, klass, blockPaths } = hbs_extractor_1.extractRelationships(items, projectRoot);
    // console.log('parents', parents);
    // console.log('scopes', scopes);
    // console.log('blockPaths', blockPaths);
    // console.log('componentsForImport', componentsForImport);
    // console.log('globalRegistry', globalRegistry);
    const definedScope = {
        ["each"]: "EachHelper",
        ["let"]: "LetHelper",
        ["hash"]: "HashHelper",
        ["array"]: "ArrayHelper",
        ["if"]: "typeof TIfHeper",
        ["on"]: "OnModifer",
        ["fn"]: "FnHelper",
        ["yield"]: "YieldHelper",
        ["has-block"]: "YieldHelper",
        ["outlet"]: "YieldHelper",
        ["concat"]: "ConcatHelper",
        ["prevent-default"]: "EventCatcherHelper",
        ["stop-propagation"]: "EventCatcherHelper",
        ["lazy-mount"]: "(params?, hash?)=>[{isLoading: boolean, error: any}]",
        ["v-get"]: "([ctx, prop]: [Object, string], hash?) => any",
        ["and"]: "AndHelper"
    };
    const globalScope = Object.assign({}, definedScope);
    const pathsForGlobalScope = {
        each: "<T>(params: ArrayLike<T>[], hash?)",
        let: "<A,B,C,D,E>(params: [A,B?,C?,D?,E?], hash?)",
        and: "<A,B,C,D,E>(params: [A,B,C?,D?,E?])",
        'stop-propagation': "<A,B,C,D,E>(params?: [A?,B?,C?,D?,E?])",
        'prevent-default': "<A,B,C,D,E>(params?: [A?,B?,C?,D?,E?])",
        array: "<T>(params: ArrayLike<T>, hash?)",
        hash: "<T>(params = [], hash: T)",
        if: "<T,U,Y>([a,b,c]:[T?,U?,Y?], hash?)",
        fn: "(params: any[])",
        on: "([eventName, handler]: [string, Function], hash?)",
        yield: "<A,B,C,D,E>(params?: [A?,B?,C?,D?,E?], hash?)"
    };
    const tailForGlobalScope = {
        if: "([a as T,b as U,c as Y], hash)",
        let: "(params as [A,B,C,D,E], hash)",
        and: "(params as [A,B,C,D,E])",
        'prevent-default': "(params as [A,B,C,D,E])",
        'stop-propagation': "(params as [A,B,C,D,E])",
        yield: "(params as [A,B,C,D,E], hash)",
        fn: "(params)",
        on: "([eventName, handler], hash)"
    };
    function getItemScopes(key, itemScopes = []) {
        let p = Object.keys(parents);
        let parent = null;
        p.forEach(pid => {
            if (pid !== key && parents[pid].includes(key)) {
                parent = pid;
            }
        });
        if (parent) {
            itemScopes.push([parent, scopes[parent] || []]);
            return getItemScopes(parent, itemScopes);
        }
        return itemScopes;
    }
    function getPathScopes(node, key) {
        const scopeChain = node.original.replace(utils_1.PLACEHOLDER, "").split(".");
        const scopeKey = scopeChain.shift();
        const itemScopes = getItemScopes(key);
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
    const tokensToProcess = Object.keys(klass).sort();
    const pathTokens = tokensToProcess.filter((name) => name.includes('PathExpression'));
    const otherTokens = tokensToProcess.filter((name) => !pathTokens.includes(name));
    let builtinImports = [];
    pathTokens.forEach((key) => {
        let node = klass[key];
        const { result, simpleResult, builtinScopeImports } = hbs_transform_1.transformPathExpression(node, key, {
            yields,
            importNameForItem,
            componentImport,
            getPathScopes,
            globalScope,
            declaredInScope: (name) => {
                return declaredInScope(name, globalRegistry);
            },
            blockPaths,
            globalRegistry,
            tailForGlobalScope,
            getItemScopes,
            addComponentImport,
            pathsForGlobalScope,
            addImport,
            componentsForImport
        });
        klass[key] = result;
        builtinScopeImports.forEach((name) => {
            if (!builtinImports.includes(name)) {
                builtinImports.push(name);
            }
        });
        klass[key + '_simple'] = simpleResult;
    });
    otherTokens.forEach(key => {
        let node = klass[key];
        if (hbs_transform_1.transform.support(node)) {
            klass[key] = hbs_transform_1.transform.transform(node, key, klass);
        }
    });
    return makeClass({ meta, imports: Array.from(new Set(imports)), builtinImports, yields, klass, comments, componentImport, globalScope, definedScope });
}
exports.getClass = getClass;
function serializeKey(key) {
    return key.split(" - ")[0];
}
function makeClass({ meta, builtinImports, imports, yields, klass, comments, componentImport, globalScope, definedScope }) {
    const hasNocheck = comments.find(([_, el]) => el.includes('@ts-nocheck'));
    const hasArgsTypings = comments.find(([_, el]) => el.includes('interface Args'));
    function commentForNode(rawPos) {
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
    let isTemplateOnlyComponent = !componentImport;
    const componentKlassImport = componentImport
        ? `import Component from "${componentImport}";`
        : "";
    const templateComponentDeclaration = componentImport
        ? `export default class ${meta.className}Template extends Component`
        : `export default class ${meta.className}TemplateOnlyComponent`;
    const componentExtraProperties = componentImport && !hasArgsTypings
        ? ""
        : `
    args: ${hasArgsTypings ? 'Args' : 'any'};
  `;
    builtinImports.push('GlobalRegistry');
    let klssTpl = `

${hasNocheck ? '// @ts-nocheck' : ''}
${componentKlassImport}
${imports.join("\n")}
import { ${builtinImports.join(', ')} } from "ember-typed-templates";
interface TemplateScopeRegistry {
${Object.keys(globalScope)
        .filter((key) => !(key in definedScope))
        .map(key => {
        return `  ["${key}"]:${globalScope[key]};`;
    })
        .join("\n")}
}

type Modify<T, R> = Omit<T, keyof R> & R;

type EmberTemplateScopeRegistry = Modify<TemplateScopeRegistry, GlobalRegistry>;

${hasArgsTypings ? hasArgsTypings[1] : ''}

${templateComponentDeclaration} {
  ${componentExtraProperties}
  ${isTemplateOnlyComponent ? `constructor(owner:unknown, args: ${hasArgsTypings ? 'Args' : 'any'}) { this.args = args; }` : ''}
  globalScope:  EmberTemplateScopeRegistry;
  defaultYield() {
    return ${yields.length ? `this['${yields[0]}']()` : "[]"};
  }
  //@mark-meaningful-issues-start
  ${Object.keys(klass).filter((name) => !name.endsWith('_simple'))
        .map(key => {
        return `${commentForNode(serializeKey(key))}
  //@mark [${serializeKey(key)}]
  "${key}"${klass[key]};`;
    }).join("\n")}
}
    
`;
    return klssTpl.trim();
}
//# sourceMappingURL=hbs-converter.js.map