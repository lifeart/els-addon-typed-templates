"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
function isParamPath(astPath) {
    const parentType = astPath.parent && astPath.parent.type;
    const itemsWithBlock = [
        "BlockStatement",
        "SubExpression",
        "MustacheStatement",
        "ElementModifierStatement"
    ];
    if (itemsWithBlock.includes(parentType)) {
        return astPath.parent.params.includes(astPath.node);
    }
    return false;
}
exports.isParamPath = isParamPath;
function realPathName(focusPath) {
    return focusPath.sourceForNode().replace(utils_1.PLACEHOLDER, "");
}
exports.realPathName = realPathName;
function isArgumentName(textPath) {
    return textPath.startsWith('@');
}
exports.isArgumentName = isArgumentName;
function normalizeArgumentName(textPath) {
    return textPath.replace('@', 'this.args.');
}
exports.normalizeArgumentName = normalizeArgumentName;
function serializeArgumentName(textPath) {
    return textPath.replace('this.args.', '@');
}
exports.serializeArgumentName = serializeArgumentName;
function canHandle(type, focusPath) {
    if (type !== "template") {
        return false;
    }
    if (focusPath.node.type !== "PathExpression") {
        return false;
    }
    if (focusPath.node.this === false && focusPath.node.data === false) {
        return false;
    }
    return true;
}
exports.canHandle = canHandle;
function isEachArgument(focusPath) {
    if (focusPath.parent.type === "BlockStatement") {
        if (focusPath.parent.path.original === "each" &&
            focusPath.parent.params[0] === focusPath.node) {
            return true;
        }
    }
}
exports.isEachArgument = isEachArgument;
//# sourceMappingURL=ast-helpers.js.map