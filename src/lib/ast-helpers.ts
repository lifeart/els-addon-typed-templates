import { PLACEHOLDER, normalizeAngleTagName } from './utils';
import { builders as b } from '@glimmer/syntax';

export function isParamPath(astPath) {
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
export function relplaceFocusPathForExternalComponentArgument(focusPath) {
  let truePath = focusPath;
  if (focusPath.node.type === 'TextNode') {
    truePath = focusPath.parentPath;
  }
  return truePath;
}
export function isExternalComponentArgument(focusPath) {
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
export function realPathName(focusPath) {
  return focusPath.sourceForNode().replace(PLACEHOLDER, "");
}

export function isArgumentName(textPath) {
  return textPath.startsWith('@');
}

export function normalizeArgumentName(textPath) {
  return textPath.replace('@', 'this.args.');
}

export function serializeArgumentName(textPath) {
  return textPath.replace('this.args.', '@').replace('ELSCompletionDummy','');
}

export function canHandle(type: string, focusPath: any) {
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

export function isEachArgument(focusPath) {
  if (focusPath.parent.type === "BlockStatement") {
    if (
      focusPath.parent.path.original === "each" &&
      focusPath.parent.params[0] === focusPath.node
    ) {
      return true;
    }
  }
}

export function isSimpleBlockComponentElement(node) {
  if (node.tag.startsWith('this.')) {
    return true;
  }
  return !node.tag.startsWith('.') && node.tag.charAt(0) !== '@' && node.tag.charAt(0) === node.tag.charAt(0).toUpperCase() && node.tag.indexOf('.') === -1;
}

export function positionForItem(item) {
  if (!item.loc) {
    throw new Error(`Unknown position fro ${item.type}`);
  }
  const { start, end } = item.loc;
  return `${start.line},${start.column}:${end.line},${end.column}`;
}
export function keyForItem(item) {
  return `${positionForItem(item)} - ${item.type}`;
}

export function tagComponentToBlock(node) {
  const componentName = node.tag.startsWith('this.') ? node.tag : normalizeAngleTagName(node.tag);
  return {
    type: 'BlockStatement',
    isComponent: true,
    path: b.path(componentName, node.loc),
    params: [],
    inverse: null,
    hash: {
      type: 'Hash',
      pairs: node.attributes.filter((attr)=>attr.name.startsWith('@')).map((attr)=>{
        let value = attr.value;
        if (value.type === 'MustacheStatement') {
          //@ts-ignore
          value.type = 'SubExpression';
          //@ts-ignore
          value.isIgnored = true;
        }
        return b.pair(attr.name.replace('@', ''), value, attr.loc);
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