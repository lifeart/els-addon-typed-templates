"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const camelcase = require("camelcase");
const fs = require("fs");
const resolvers_1 = require("./resolvers");
const ast_parser_1 = require("./ast-parser");
const hbs_extractor_1 = require("./hbs-extractor");
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
    'partial',
    'yield'
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
function registerTemplateKlassForFile(componentsMap, registry, virtualFileName, templateFileName, scriptFileName, depth) {
    let klass = `
  export default EmptyKlass {
    args: any;
    defaultYield() { return []; };
  };
  `;
    try {
        let source = fs.readFileSync(templateFileName, "utf8");
        const { nodes, comments } = ast_parser_1.getClassMeta(source);
        klass = getClass(componentsMap, virtualFileName, { nodes, comments }, scriptFileName ? resolvers_1.relativeImport(templateFileName, scriptFileName) : null, registry, depth);
    }
    catch (e) {
        console.log(e);
    }
    console.log("--------------------------");
    console.log(virtualFileName);
    console.log("--------------------------");
    console.log(klass);
    console.log("--------------------------");
    componentsMap[virtualFileName] = klass;
}
function getClass(componentsMap, fileName, { nodes, comments }, componentImport, globalRegistry, depth = 1) {
    const yields = [];
    const imports = [];
    const items = nodes;
    if (depth < 0) {
        return `export default class UnreachedComponent { args: any; defaultYield() { return []; } };`;
    }
    function addImport(name, filePath) {
        imports.push(`import ${importNameForItem(name)} from "${filePath}";`);
    }
    function addComponentImport(name, filePath) {
        let virtualFileName = resolvers_1.virtualComponentTemplateFileName(filePath.template);
        registerTemplateKlassForFile(componentsMap, globalRegistry, virtualFileName, filePath.template, filePath.script, depth - 1);
        // todo - we need to resolve proper template and compile it :)
        addImport(name, resolvers_1.relativeImport(fileName, virtualFileName));
    }
    const { componentsForImport, parents, scopes, klass, blockPaths } = hbs_extractor_1.extractRelationships(items);
    // console.log('componentsForImport', componentsForImport);
    // console.log('globalRegistry', globalRegistry);
    const globalScope = {
        ["each"]: "EachHelper",
        ["let"]: "LetHelper",
        ["hash"]: "HashHelper",
        ["array"]: "ArrayHelper",
        ["if"]: "typeof TIfHeper",
        ["on"]: "OnModifer",
        ["fn"]: "FnHelper",
        ["yield"]: "YieldHelper",
        ["concat"]: "ConcatHelper",
        ["prevent-default"]: "EventCatcherHelper",
        ["stop-propagation"]: "EventCatcherHelper",
        ["lazy-mount"]: "(params?, hash?)=>[{isLoading: boolean, error: any}]",
        ["v-get"]: "([ctx, prop]: [Object, string], hash?) => any",
        ["and"]: "AndHelper"
    };
    let typeDeclarations = `

  type YieldHelper = <A,B,C,D,E>(items: [A,B,C,D,E], hash?) => [A,B,C,D,E];
  type EachHelper = <T>([items]:ArrayLike<T>[], hash?) =>  [T, number];
  type LetHelper = <A,B,C,D,E>(items: [A,B,C,D,E], hash?) => [A,B,C,D,E];
  type AbstractHelper = <T>([items]:T[], hash?) => T;
  type AbstractBlockHelper = <T>([items]:ArrayLike<T>[], hash?) => [T];
  type HashHelper = <T>(items: any[], hash: T) => T;
  type ArrayHelper =  <T>(items:ArrayLike<T>, hash?) => ArrayLike<T>;
  type AnyFn = (...args) => any;
  type OnModifer = ([event, handler]: [string, Function], hash?) => void;
  type FnHelper =  AnyFn;
  type ConcatHelper = (...args: (number|string)[]) => string;
  type AndHelper = <A,B,C,D,E>(items: [A,B,C?,D?,E?]) => boolean;
  type EventCatcherHelper = <A,B,C,D,E>(items?:[A?,B?,C?,D?,E?]) => AnyFn;

  function TIfHeper<T,U,Y>([a,b,c]:[T,U?,Y?], hash?) {
    return !!a ? b : c;
  }
  
  
  `;
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
            if (parents[pid].includes(key)) {
                parent = pid;
            }
        });
        if (parent) {
            itemScopes.push([parent, scopes[parent]]);
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
    Object.keys(klass).forEach(key => {
        let node = klass[key];
        if (hbs_transform_1.transform.support(node)) {
            klass[key] = hbs_transform_1.transform.transform(node, key);
        }
        else if (node.type === "PathExpression") {
            klass[key] = hbs_transform_1.transformPathExpression(node, key, {
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
        }
    });
    return makeClass({ imports, yields, klass, comments, typeDeclarations, componentImport, globalScope });
}
exports.getClass = getClass;
function serializeKey(key) {
    return key.split(" - ")[0];
}
function makeClass({ imports, yields, klass, comments, typeDeclarations, componentImport, globalScope }) {
    const hasNocheck = comments.find(([_, el]) => el.includes('@ts-nocheck'));
    function commentForNode(rawPos) {
        let pos = parseInt(rawPos.split(':')[0].split(',')[0], 10);
        let comment = comments.find(([commentPos]) => commentPos === pos);
        if (comment) {
            let value = comment[1].trim();
            return value.includes('/') ? value : '// ' + value;
        }
        else {
            return '';
        }
    }
    const componentKlassImport = componentImport
        ? `import Component from "${componentImport}";`
        : "";
    const templateComponentDeclaration = componentImport
        ? `export default class Template extends Component`
        : `export default class TemplateOnlyComponent`;
    const componentExtraProperties = componentImport
        ? ""
        : `
    args: any;
  `;
    let klssTpl = `

  ${hasNocheck ? '// @ts-nocheck' : ''}

  ${componentKlassImport}

  ${imports.join("\n")}

  ${typeDeclarations}
  
  interface IKnownScope {
    ${Object.keys(globalScope)
        .map(key => {
        return `["${key}"]:${globalScope[key]};`;
    })
        .join("\n")}
  }
  
  interface IGlobalScope {
    [key: string ]: AbstractHelper | AbstractBlockHelper
  }
  
  type GlobalScope = IGlobalScope & IKnownScope;


  ${templateComponentDeclaration} {
      ${componentExtraProperties}
      globalScope:  GlobalScope;
      defaultYield() {
        return ${yields.length ? `this['${yields[0]}']()` : "[]"};
      }
      //@mark-meaningful-issues-start
      ${Object.keys(klass)
        .map(key => {
        return `${commentForNode(serializeKey(key))}
          //@mark [${serializeKey(key)}]
          "${key}"${klass[key]};`;
    })
        .join("\n")}
  }
      
  `;
    return klssTpl;
}
//# sourceMappingURL=hbs-converter.js.map