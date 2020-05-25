import { PLACEHOLDER } from "./utils";

function serializeKey(key) {
  return key.split(" - ")[0];
}
export function keyForItem(item) {
  return `${positionForItem(item)} - ${item.type}`;
}

export function positionForItem(item) {
  const { start, end } = item.loc;
  return `${start.line},${start.column}:${end.line},${end.column}`;
}

function normalizePathOriginal(node) {
  if (node.data === true) {
    return `this.args.${node.original
      .replace(PLACEHOLDER, "")
      .replace("@", "")}`;
  } else if (node.this === true) {
    return `${node.original.replace(PLACEHOLDER, "")}`;
  } else {
    return node.original;
  }
}

export function transformPathExpression(
  node,
  key,
  {
    getItemScopes,
    tailForGlobalScope,
    pathsForGlobalScope,
    importNameForItem,
    componentImport,
    declaredInScope,
    addImport,
    addComponentImport,
    getPathScopes,
    yields,
    componentsForImport,
    globalScope,
    blockPaths,
    globalRegistry
  }
) {
  let result: string = "";
  let simpleResult: string = "";
  const builtinScopeImports = new Set();
  if (node.data === true) {
    result = transform.wrapToFunction(normalizePathOriginal(node), key);
  } else if (node.this === true) {
    result = transform.fn(
      componentImport ? "" : "this: null",
      normalizePathOriginal(node),
      key
    );
  } else {
    const { foundKey, scopeKey, scopeChain } = getPathScopes(node, key);
    if (foundKey === "globalScope") {
      if (!(scopeKey in globalScope)) {
        if (blockPaths.includes(key)) {
          if (declaredInScope(scopeKey)) {
            globalScope[scopeKey] = "AbstractBlockHelper";
            builtinScopeImports.add('AbstractBlockHelper');
          } else {
            globalScope[scopeKey] = 'undefined';
          }
          if (
            scopeKey in globalRegistry &&
            componentsForImport.includes(scopeKey)
          ) {
            addComponentImport(scopeKey, globalRegistry[scopeKey]);
          }
        } else {
          if (scopeKey in globalRegistry) {
            addImport(scopeKey, globalRegistry[scopeKey]);
            globalScope[scopeKey] = importNameForItem(scopeKey);
          } else {
            if (declaredInScope(scopeKey)) {
              globalScope[scopeKey] = "AbstractHelper";
              builtinScopeImports.add('AbstractHelper');
            } else {
              globalScope[scopeKey] = 'undefined';
            }
          }
        }
      }
      if (pathsForGlobalScope[scopeKey]) {
        simpleResult = `this.globalScope["${scopeKey}"]`;
        result = transform.fn(
          pathsForGlobalScope[scopeKey],
          `this.globalScope["${scopeKey}"]${
            tailForGlobalScope[scopeKey]
              ? tailForGlobalScope[scopeKey]
              : "(params, hash)"
          }`,
          key
        );
        if (scopeKey === "yield") {
          const scopes = getItemScopes(key);
          const slosestScope = scopes[0];
          if (!slosestScope) {
            console.log("unable to find scope for " + key);
          } else {
            yields.push(slosestScope[0]);
          }
        }
      } else {
        if (
          scopeKey in globalRegistry &&
          componentsForImport.includes(scopeKey)
        ) {
          addComponentImport(scopeKey, globalRegistry[scopeKey]);
          result = transform.fn(
            `_, hash: typeof ${importNameForItem(
              scopeKey
            )}.prototype.args`,
            `let klass = new ${importNameForItem(
              scopeKey
            )}(this as unknown, hash); klass.args = hash; return klass.defaultYield()`,
            key
          );
        } else {
          simpleResult = `this.globalScope["${scopeKey}"]`;
          result = transform.fn(
            "params?, hash?",
            `this.globalScope["${scopeKey}"](params, hash)`,
            key
          );
        }
      }
    } else {
      if (scopeChain.length) {
        result = transform.fn(
          "",
          `this["${foundKey[0]}"]()[${foundKey[1]}].${scopeChain.join(".")}`,
          key
        );
      } else {
        result = transform.fn(
          "",
          `this["${foundKey[0]}"]()[${foundKey[1]}]`,
          key
        );
      }
    }
  }
  return {result, simpleResult, builtinScopeImports: Array.from(builtinScopeImports)};
}

export const transform = {
  klass: {},
  support(node) {
    return node.type in this;
  },
  transform(node: any, key: string, klass?: any) {
    if (klass) {
      this.klass = klass;
    }
    const typeKey = `TypeFor${node.type}`;
    const typings = (typeKey in this) ? ': ' + this[typeKey](node) : '';
    return this._wrap(this[node.type](node), key, typings);
  },
  wrapToFunction(str: string, key: string) {
    return this._wrap(str, key);
  },
  addMark(key: string) {
    return `/*@path-mark ${serializeKey(key)}*/`;
  },
  _wrap(str: string, key: string, returnType: string = '') {
    return `()${returnType} { return ${str}; ${this.addMark(key)}}`;
  },
  fn(args: string, body: string, key: string) {
    return this._makeFn(args, body, key);
  },
  _makeFn(rawArgs: string, rawBody: string, key: string) {
    let body = `return ${rawBody}`;
    if (rawBody.includes("return ")) {
      body = rawBody;
    }
    let args = `(${rawArgs})`;
    if (rawArgs.includes("(") && rawArgs.includes(")")) {
      args = rawArgs;
    }
    return `${args} { ${body}; ${this.addMark(key)}}`;
  },
  TextNode(node) {
    return `"${node.chars}"`;
  },
  TypeForTextNode(node) {
    return `"${node.chars}" `;
  },
  pathCall(node) {
    let key = keyForItem(node);
    let simpleKey = key + '_simple';
    if (this.klass && this.klass[simpleKey]) {
      let value = this.klass[simpleKey];
      delete this.klass[simpleKey];
      delete this.klass[key];
      return value;
    }
    return `this["${keyForItem(node)}"]`;
  },
  hashedExp(node, nodeType = 'DEFAULT') {
    let result = "";
    const params = node.params
      .map(p => {
        return `this["${keyForItem(p)}"]()`;
      })
      .join(",");
    const hash = node.hash.pairs
      .map(p => {
        return `'${p.key}':this["${keyForItem(p.value)}"]()`;
      })
      .join(",");
    if (hash.length && params.length) {
      result = `${this.pathCall(node.path)}([${params}],{${hash}})`;
    } else if (!hash.length && params.length) {
      result = `${this.pathCall(node.path)}([${params}])`;
    } else if (hash.length && !params.length) {
      result = `${this.pathCall(node.path)}([],{${hash}})`;
    } else {
      if (nodeType === 'BlockStatement') {
        result = `${this.pathCall(node.path)}([], {})`;
      } else {
        result = `${this.pathCall(node.path)}()`;
      }
    }
    return result;
  },
  SubExpression(node) {
    return this.hashedExp(node);
  },
  MustacheStatement(node) {
    return this.hashedExp(node);
  },
  ElementModifierStatement(node) {
    return this.hashedExp(node);
  },
  BlockStatement(node) {
    return this.hashedExp(node, 'BlockStatement');
  },
  NumberLiteral(node) {
    return `${node.value}`;
  },
  TypeForNumberLiteral(node) {
    return `${node.value}`;
  },
  StringLiteral(node) {
    return `"${node.value}"`;
  },
  TypeForStringLiteral(node) {
    return `"${node.value}"`;
  },
  TypeForNullLiteral() {
    return `null`;
  },
  NullLiteral() {
    return "null";
  },
  BooleanLiteral(node) {
    return `${node.value === true ? "true" : "false"}`;
  },
  UndefinedLiteral() {
    return "undefined";
  }
};
