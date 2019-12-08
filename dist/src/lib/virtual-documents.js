"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
// import * as fs from "fs";
const resolvers_1 = require("./resolvers");
const hbs_converter_1 = require("./hbs-converter");
// function yieldedContext() {
//   return `
//   _template_BlockStatement_Each_FirstBlock() {
//     return this._template_PathExpresion()[0];
//   }
//   `;
// }
function createFullVirtualTemplate(projectRoot, componentsMap, templatePath, fileName, server, uri) {
    const document = server.documents.get(uri);
    const content = document.getText();
    const templateTokens = hbs_converter_1.getClassMeta(content);
    const scriptForComponent = resolvers_1.findComponentForTemplate(templatePath, projectRoot);
    const relComponentImport = resolvers_1.relativeComponentImport(fileName, scriptForComponent);
    componentsMap[fileName] = hbs_converter_1.getClass(templateTokens, relComponentImport);
    return componentsMap[fileName];
}
exports.createFullVirtualTemplate = createFullVirtualTemplate;
function createVirtualTemplate(projectRoot, componentsMap, fileName, { templatePath, realPath, isArg, isArrayCase, isParam }) {
    // console.log('createVirtualTemplate')
    const scriptForComponent = resolvers_1.findComponentForTemplate(templatePath, projectRoot);
    // console.log('scriptForComponent', scriptForComponent)
    const relComponentImport = resolvers_1.relativeComponentImport(fileName, scriptForComponent);
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
    let posStart = getBasicComponent(utils_1.PLACEHOLDER, { relComponentImport, isParam, isArrayCase, isArg }).indexOf(utils_1.PLACEHOLDER);
    let pos = posStart + realPath.length;
    return { pos, posStart };
}
exports.createVirtualTemplate = createVirtualTemplate;
function getBasicComponent(pathExp = utils_1.PLACEHOLDER, flags = {}) {
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
exports.getBasicComponent = getBasicComponent;
//# sourceMappingURL=virtual-documents.js.map