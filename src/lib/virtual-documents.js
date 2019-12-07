"use strict";
exports.__esModule = true;
var utils_1 = require("./utils");
var fs = require("fs");
var resolvers_1 = require("./resolvers");
// function yieldedContext() {
//   return `
//   _template_BlockStatement_Each_FirstBlock() {
//     return this._template_PathExpresion()[0];
//   }
//   `;
// }
function createVirtualTemplate(projectRoot, componentsMap, fileName, _a) {
    var templatePath = _a.templatePath, realPath = _a.realPath, isArg = _a.isArg, isArrayCase = _a.isArrayCase, isParam = _a.isParam;
    console.log('createVirtualTemplate');
    var scriptForComponent = resolvers_1.findComponentForTemplate(templatePath, projectRoot);
    console.log('scriptForComponent', scriptForComponent);
    var relComponentImport = resolvers_1.relativeComponentImport(fileName, scriptForComponent);
    console.log('relComponentImport', relComponentImport);
    componentsMap[scriptForComponent] = fs.readFileSync(scriptForComponent, "utf8");
    componentsMap[fileName] = getBasicComponent(realPath, {
        relComponentImport: relComponentImport,
        isArg: isArg,
        isParam: isParam,
        isArrayCase: isArrayCase
    });
    var posStart = getBasicComponent(utils_1.PLACEHOLDER, { relComponentImport: relComponentImport, isParam: isParam, isArrayCase: isArrayCase, isArg: isArg }).indexOf(utils_1.PLACEHOLDER);
    var pos = posStart + realPath.length;
    return { pos: pos, posStart: posStart };
}
exports.createVirtualTemplate = createVirtualTemplate;
function getBasicComponent(pathExp, flags) {
    if (pathExp === void 0) { pathExp = utils_1.PLACEHOLDER; }
    if (flags === void 0) { flags = {}; }
    var outputType = "string | number | void";
    var relImport = flags.relComponentImport || "./component";
    if (flags.isArrayCase) {
        outputType = "any[]";
    }
    if (flags.isParam) {
        outputType = "any";
    }
    return [
        "import Component from \"" + relImport + "\";",
        "export default class Template extends Component {",
        "_template_PathExpresion(): " + outputType + " {",
        "return " + pathExp,
        "}",
        "}"
    ].join("");
}
exports.getBasicComponent = getBasicComponent;
