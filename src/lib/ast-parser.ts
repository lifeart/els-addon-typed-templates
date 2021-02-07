import { preprocess as parse, traverse } from "@glimmer/syntax";

import {
  isSimpleBlockComponentElement,
  tagComponentToBlock
} from "./ast-helpers";

function cleanComment(text) {
  return text.replace(/<\/?script[^>]*>/g,'');
}

export function getFirstASTNode(source) {
  try {
    return parse(source).body[0];
  } catch(e) {
    return null;
  }
}
export function getClassMeta(source) {
  const nodes: any = [];
  const comments: any = [];
  try {
    const node = parse(source);

    traverse(node, {
      MustacheStatement(node) {
        //@ts-ignore
        if (!node.isIgnored) {
          nodes.push([node]);
        }
      },
      MustacheCommentStatement(node) {
        if (node.loc) {
          comments.push([node.loc.end.line + 1, cleanComment(node.value)]);
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
        } else if (node.tag === 'script' && node.attributes.find(({name})=>name === '@typedef')) {
          const text: any = node.children.find(({type})=> type === 'TextNode');
          if (text) {
            comments.push([node.loc.end.line + 1, text.chars]);
          }
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

  return {
    nodes, comments
  };
}
