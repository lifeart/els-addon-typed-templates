import { PLACEHOLDER } from "./utils";
import * as camelcase from "camelcase";
import * as fs from "fs";
import { relativeImport, virtualComponentTemplateFileName } from "./resolvers";
import { getClassMeta } from "./ast-parser";
import { extractRelationships } from './hbs-extractor';
import {
  transform,
  transformPathExpression
} from "./hbs-transform";

function importNameForItem(item) {
  return (
    "TemplateImported_" +
    camelcase(item, { pascalCase: true })
      .split("/")
      .join("_")
  );
}

function registerTemplateKlassForFile(
  componentsMap,
  registry,
  virtualFileName,
  templateFileName,
  scriptFileName,
  depth: number
) {
  let klass = `
  export default EmptyKlass {
    args: any;
    defaultYield() { return []; };
  };
  `;
  try {
    let source = fs.readFileSync(templateFileName, "utf8");
    let items = getClassMeta(source);
    klass = getClass(
      componentsMap,
      virtualFileName,
      items,
      scriptFileName ? relativeImport(templateFileName, scriptFileName) : null,
      registry,
      depth
    );
  } catch (e) {
    console.log(e);
  }
  console.log("--------------------------");
  console.log(virtualFileName);
  console.log("--------------------------");
  console.log(klass);
  console.log("--------------------------");

  componentsMap[virtualFileName] = klass;
}

export function getClass(
  componentsMap,
  fileName,
  items,
  componentImport: string | null,
  globalRegistry: any,
  depth: number = 1
) {
  const yields: string[] = [];
  const imports: string[] = [];
 

  if (depth < 0) {
    return `export default class UnreachedComponent { args: any; defaultYield() { return []; } };`;
  }

  function addImport(name, filePath) {
    imports.push(`import ${importNameForItem(name)} from "${filePath}";`);
  }

  function addComponentImport(name, filePath) {
    let virtualFileName = virtualComponentTemplateFileName(filePath.template);
    registerTemplateKlassForFile(
      componentsMap,
      globalRegistry,
      virtualFileName,
      filePath.template,
      filePath.script,
      depth - 1
    );
    // todo - we need to resolve proper template and compile it :)
    addImport(name, relativeImport(
      fileName,
      virtualFileName
    ));
  }
  
  const {
    componentsForImport,
    parents,
    scopes,
    klass,
    blockPaths
  } = extractRelationships(items);


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
    ["and"]: "AndHelper"
  };

  const pathsForGlobalScope = {
    each: "<T>(params: ArrayLike<T>[], hash?)",
    let: "<A,B,C,D,E>(params: [A,B?,C?,D?,E?], hash?)",
    array: "<T>(params: ArrayLike<T>, hash?)",
    hash: "<T>(params = [], hash: T)",
    if: "<T,U,Y>([a,b,c]:[T?,U?,Y?], hash?)",
    fn: "([fn, ...args]: [AnyFn, ...Parameters<AnyFn>], hash?)",
    on: "([eventName, handler]: [string, Function], hash?)",
    yield: "<A,B,C,D,E>(params?: [A?,B?,C?,D?,E?], hash?)"
  };

  const tailForGlobalScope = {
    if: "([a as T,b as U,c as Y], hash)",
    let: "(params as [A,B,C,D,E], hash)",
    yield: "(params as [A,B,C,D,E], hash)",
    fn: "[fn, args as Parameters<AnyFn>[]]",
    on: "([eventName, handler], hash)"
  };

  function getItemScopes(key, itemScopes: any = []) {
    let p = Object.keys(parents);
    let parent: string | null = null;
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
    const scopeChain = node.original.replace(PLACEHOLDER, "").split(".");
    const scopeKey = scopeChain.shift();
    const itemScopes = getItemScopes(key);
    let foundKey: string | any[] = "globalScope";
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
    if (transform.support(node.type)) {
      klass[key] = transform.transform(node, key);
    } else if (node.type === "PathExpression") {
      klass[key] = transformPathExpression(node, key, {
        yields,
        importNameForItem,
        componentImport,
        getPathScopes,
        globalScope,
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

  Object.keys(klass).forEach(key => {
    let hashLike = ['SubExpression','MustacheStatement','ElementModifierStatement','BlockStatement'];
    if (hashLike.includes(klass[key].type)) {
      klass[key] = transform.transform(klass[key], key);
    }
  });

  return makeClass({ imports, yields, klass, componentImport, globalScope });
}

function serializeKey(key) {
  return key.split(" - ")[0];
}

function makeClass({ imports, yields, klass, componentImport, globalScope }) {
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

  let typeDeclarations = `

  type YieldHelper = <A,B,C,D,E>(items: [A,B,C,D,E], hash?) => [A,B,C,D,E];
  type EachHelper = <T>([items]:ArrayLike<T>[], hash?) =>  [T, number];
  type LetHelper = <A,B,C,D,E>(items: [A,B,C,D,E], hash?) => [A,B,C,D,E];
  type AbstractHelper = <T>([items]:T[], hash?) => T;
  type AbstractBlockHelper = <T>([items]:ArrayLike<T>[], hash?) => [T];
  type HashHelper = <T>(items: any[], hash: T) => T;
  type ArrayHelper =  <T>(items:ArrayLike<T>, hash?) => ArrayLike<T>;
  type OnModifer = ([event, handler]: [string, Function], hash?) => void;
  type FnHelper = <T extends AnyFn>([func, ...params]:[T,Parameters<T>]) => T;
  type ConcatHelper = (...args: (number|string)[]) => string;
  type AndHelper = <T,U>([a,b]:[T,U])=> boolean;
  

  function TIfHeper<T,U,Y>([a,b,c]:[T,U?,Y?], hash?) {
    return !!a ? b : c;
  }
  
  
  `;

  let klssTpl = `

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
          return `
          //@mark [${serializeKey(key)}]
          "${key}"${klass[key]};`;
        })
        .join("\n")}
  }
      
  `;

  return klssTpl;
}
