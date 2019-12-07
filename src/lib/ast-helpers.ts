import { PLACEHOLDER } from './utils';

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
  return textPath.replace('this.args.', '@');
}

export function canHandle(type: string, focusPath: any) {
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