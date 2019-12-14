import { preprocess as parse, traverse } from "@glimmer/syntax";

import {
  isSimpleBlockComponentElement,
  tagComponentToBlock
} from "./ast-helpers";

export function getClassMeta(source) {
  const nodes: any = [];

  try {
    const node = parse(source);

    traverse(node, {
      MustacheStatement(node) {
        //@ts-ignore
        if (!node.isIgnored) {
          nodes.push([node]);
        }
      },
      BlockStatement(node) {
        nodes.push([node]);
      },
      ElementModifierStatement(node) {
        nodes.push([node]);
      },
      ElementNode(node) {
        if (isSimpleBlockComponentElement(node)) {
          nodes.push([tagComponentToBlock(node)]);
        }
      },
      SubExpression(node) {
        if (nodes[nodes.length - 1]) {
          nodes[nodes.length - 1].push(node);
        } else {
          console.log("unexpectedSubexpression", node);
        }
      }
    });
  } catch(e) {
      // 
  }

  return nodes;
}
