import { PLACEHOLDER } from './utils';
// import * as fs from "fs";
import {
  findComponentForTemplate,
  relativeComponentImport
} from "./resolvers";
// function yieldedContext() {
//   return `
//   _template_BlockStatement_Each_FirstBlock() {
//     return this._template_PathExpresion()[0];
//   }
//   `;
// }

export function createVirtualTemplate(projectRoot, componentsMap, fileName, { templatePath, realPath, isArg, isArrayCase, isParam }: any) {

  // console.log('createVirtualTemplate')
  const scriptForComponent = findComponentForTemplate(
    templatePath,
    projectRoot
  );
  // console.log('scriptForComponent', scriptForComponent)

  const relComponentImport = relativeComponentImport(
    fileName,
    scriptForComponent
  );
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
    isArrayCase
  });
  let posStart = getBasicComponent(PLACEHOLDER, { relComponentImport, isParam, isArrayCase, isArg }).indexOf(
    PLACEHOLDER
  );
  let pos = posStart + realPath.length;
  return { pos, posStart };
}



export function getBasicComponent(pathExp = PLACEHOLDER, flags: any = {}) {
    let outputType = "string | number | void";
    let relImport = flags.relComponentImport || "./component";
    if (flags.isArrayCase) {
      outputType = "any[]";
    }
    if (flags.isParam) {
      outputType = "any";
    }
    return [
      `import Component from "${relImport}";`,
      "export default class Template extends Component {",
      `_template_PathExpresion(): ${outputType} {`,
      "return " + pathExp,
      "}",
      "}"
    ].join("");
  }
  