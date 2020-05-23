import { PLACEHOLDER } from "./utils";
// import * as fs from "fs";
import {
  findComponentForTemplate,
  relativeComponentImport,
  ralativeAddonImport
} from "./resolvers";
import { MatchResult, typeForPath } from './ts-service';
import { getClass } from "./hbs-converter";
import { getClassMeta} from './ast-parser';
// function yieldedContext() {
//   return `
//   _template_BlockStatement_Each_FirstBlock() {
//     return this._template_PathExpresion()[0];
//   }
//   `;
// }

function normalizePath(name: string) {
  return name.split('\\').join('/');
}

function getValidRegistryItems(registry: any, templateFile: string) {
  const items: any = {};
  if (registry === null) {
    return items;
  } else {
    const keys = ["helper", "modifier"];
    keys.forEach(keyName => {
      Object.keys(registry[keyName]).forEach(name => {
        const itemPaths = registry[keyName][name].filter(
          p => !p.endsWith(".hbs")
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
      Object.keys(registry[keyName]).forEach(name => {
        const hasScriptHbs = registry[keyName][name].find(name=>name.endsWith('.hbs'));
        const componentScripts = registry[keyName][name].filter(
          p => !p.endsWith(".hbs") && !p.includes('/tests/') && !p.includes('/dist/')
        ).sort();
        const hasScriptTs = componentScripts.find(name=>name.endsWith('.ts'));
        const hasScriptJs = componentScripts.find(name=>name.endsWith('.js'));
        const hasAddonTs = componentScripts.find(name=>name.endsWith('.ts') && normalizePath(name).includes('/addon/'));
        const hasAddonJs = componentScripts.find(name=>name.endsWith('.js') && normalizePath(name).includes('/addon/'));
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

export function createFullVirtualTemplate(
  projectRoot,
  componentsMap,
  templatePath,
  fileName,
  server,
  uri,
  content: string | boolean = false,
  meta: MatchResult
) {
  const document = server.documents.get(uri);
  if (!document && !content) {
    return `export default class ${meta.className}Template {};`;
  }
  const registry = "getRegistry" in server ? server.getRegistry(projectRoot) : null;
  content = content ? content : document.getText();
  const { nodes, comments } = getClassMeta(content);
  
  let scriptForComponent =  findComponentForTemplate(templatePath, projectRoot)
  let relComponentImport: string | null = null;

  if (scriptForComponent) {
    relComponentImport = relativeComponentImport(fileName, scriptForComponent);
  }
  // console.log('scriptForComponent', scriptForComponent);
  componentsMap[fileName] = getClass(componentsMap,
    fileName,
    {nodes, comments, projectRoot, meta},
    relComponentImport,
    getValidRegistryItems(registry, fileName)
  );
  let debug = false;
  if (debug) {
    console.log("===============");
    console.log(componentsMap[fileName]);
    console.log("===============");
  }
  return componentsMap[fileName];
}

export function createVirtualTemplate(
  projectRoot,
  componentsMap,
  fileName,
  { templatePath, realPath, isArg, isArrayCase, isParam }: any
) {
  
  const scriptForComponent = findComponentForTemplate(
    templatePath,
    projectRoot
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

  componentsMap[fileName] = getBasicComponent(realPath, {
    relComponentImport,
    isArg,
    isParam,
    className,
    isTemplateOnly,
    isArrayCase
  });
  let posStart = getBasicComponent(PLACEHOLDER, {
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

export function getBasicComponent(pathExp = PLACEHOLDER, flags: any = {}) {
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
