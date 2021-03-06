"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tagComponentToBlock = exports.keyForItem = exports.positionForItem = exports.isSimpleBlockComponentElement = exports.isEachArgument = exports.canHandle = exports.serializeArgumentName = exports.normalizeArgumentName = exports.isArgumentName = exports.realPathName = exports.isExternalComponentArgument = exports.relplaceFocusPathForExternalComponentArgument = exports.isParamPath = void 0;
const utils_1 = require("./utils");
const syntax_1 = require("@glimmer/syntax");
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
function relplaceFocusPathForExternalComponentArgument(focusPath) {
    let truePath = focusPath;
    if (focusPath.node.type === 'TextNode') {
        truePath = focusPath.parentPath;
    }
    return truePath;
}
exports.relplaceFocusPathForExternalComponentArgument = relplaceFocusPathForExternalComponentArgument;
function isExternalComponentArgument(focusPath) {
    let truePath = focusPath;
    if (focusPath.node.type === 'TextNode') {
        truePath = focusPath.parentPath;
    }
    if (truePath.parent.type === 'ElementNode' && !isSimpleBlockComponentElement(truePath.parent)) {
        return false;
    }
    if (truePath.node.type === 'AttrNode' && truePath.node.name.startsWith('@')) {
        return true;
    }
    return false;
}
exports.isExternalComponentArgument = isExternalComponentArgument;
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
    return textPath.replace('this.args.', '@').replace('ELSCompletionDummy', '');
}
exports.serializeArgumentName = serializeArgumentName;
function canHandle(type, focusPath) {
    if (type !== "template") {
        return false;
    }
    if (focusPath.node.type !== "PathExpression") {
        if (['AttrNode'].includes(focusPath.node.type)) {
            if (focusPath.node.type === 'AttrNode' && focusPath.node.name.startsWith('@')) {
                return true;
            }
            if (focusPath.node.type === 'TextNode' && focusPath.parentPath && focusPath.parentPath.node.type == 'AttrNode' && focusPath.parentPath.node.name.startsWith('@')) {
                return true;
            }
            return false;
        }
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
    return !node.tag.startsWith('.') && node.tag.charAt(0) !== '@' && node.tag.charAt(0) === node.tag.charAt(0).toUpperCase() && node.tag.indexOf('.') === -1;
}
exports.isSimpleBlockComponentElement = isSimpleBlockComponentElement;
function positionForItem(item) {
    if (!item.loc) {
        throw new Error(`Unknown position fro ${item.type}`);
    }
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
        path: syntax_1.builders.path(componentName, node.loc),
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
                return syntax_1.builders.pair(attr.name.replace('@', ''), value, attr.loc);
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