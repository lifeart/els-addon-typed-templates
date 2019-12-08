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
function createFullVirtualTemplate(projectRoot, componentsMap, templatePath, fileName, server, uri, content = false) {
    const document = server.documents.get(uri);
    content = content ? content : document.getText();
    const templateTokens = hbs_converter_1.getClassMeta(content);
    const scriptForComponent = resolvers_1.findComponentForTemplate(templatePath, projectRoot);
    if (!scriptForComponent) {
        componentsMap[fileName] = `export default class TemplateOnlyComponent { args: any }`;
        return componentsMap[fileName];
    }
    // console.log('scriptForComponent', scriptForComponent);
    const relComponentImport = resolvers_1.relativeComponentImport(fileName, scriptForComponent);
    componentsMap[fileName] = hbs_converter_1.getClass(templateTokens, relComponentImport);
    console.log('===============');
    console.log(componentsMap[fileName]);
    console.log('===============');
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
    let posStart = getBasicComponent(utils_1.PLACEHOLDER, { relComponentImport, isParam, isTemplateOnly, isArrayCase, isArg }).indexOf(utils_1.PLACEHOLDER);
    let pos = posStart + realPath.length;
    return { pos, posStart };
}
exports.createVirtualTemplate = createVirtualTemplate;
function getBasicComponent(pathExp = utils_1.PLACEHOLDER, flags = {}) {
    let outputType = "string | number | void";
    let relImport = flags.relComponentImport || "./component";
    let templateOnly = '';
    if (flags.isTemplateOnly) {
        templateOnly = 'args: any;';
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