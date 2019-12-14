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
    const meta = focusPath.metaForType("handlebars");
    const realName = realPathName(focusPath).split('.')[0];
    const scope = meta.localScope;
    for (let i = 0; i < scope.length; i++) {
        if (scope[i].name === realName) {
            return true;
        }
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
function isSimpleBlockComponentElement(node) {
    return node.blockParams.length && node.tag.charAt(0) !== '@' && node.tag.charAt(0) === node.tag.charAt(0).toUpperCase() && node.tag.indexOf('.') === -1;
}
exports.isSimpleBlockComponentElement = isSimpleBlockComponentElement;
function positionForItem(item) {
    const { start, end } = item.loc;
    return `${start.line},${start.column}:${end.line},${end.column}`;
}
exports.positionForItem = positionForItem;
function keyForItem(item) {
    return `${positionForItem(item)} - ${item.type}`;
}
exports.keyForItem = keyForItem;
function tagComponentToBlock(node) {
    const componentName = utils_1.normalizeAngleTagName(node.tag);
    return {
        type: 'BlockStatement',
        isComponent: true,
        path: {
            type: 'PathExpression',
            original: componentName,
            this: false,
            data: false,
            parts: [componentName],
            loc: node.loc
        },
        params: [],
        inverse: null,
        hash: {
            type: 'Hash',
            pairs: node.attributes.filter((attr) => attr.name.startsWith('@')).map((attr) => {
                let value = attr.value;
                if (value.type === 'MustacheStatement') {
                    //@ts-ignore
                    value.type = 'SubExpression';
                    //@ts-ignore
                    value.isIgnored = true;
                }
                return {
                    type: 'HashPair',
                    key: attr.name.replace('@', ''),
                    value: value,
                    loc: attr.loc
                };
            })
        },
        program: {
            type: "Block",
            body: node.children,
            blockParams: node.blockParams,
            chained: false,
            loc: node.loc
        },
        loc: node.loc
    };
}
exports.tagComponentToBlock = tagComponentToBlock;
//# sourceMappingURL=ast-helpers.js.map