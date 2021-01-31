"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transform = exports.transformPathExpression = exports.normalizePathOriginal = exports.positionForItem = exports.keyForItem = void 0;
const utils_1 = require("./utils");
function serializeKey(key) {
    return key.split(" - ")[0];
}
function keyForItem(item) {
    return `${positionForItem(item)} - ${item.type}`;
}
exports.keyForItem = keyForItem;
function positionForItem(item) {
    const { start, end } = item.loc;
    return `${start.line},${start.column}:${end.line},${end.column}`;
}
exports.positionForItem = positionForItem;
function normalizePathOriginal(node) {
    let prepared = '';
    if (node.head.type === 'AtHead') {
        prepared = `this.args.${node.original
            .replace(utils_1.PLACEHOLDER, "")
            .replace("@", "")}`;
    }
    else if (node.head.type === 'ThisHead') {
        prepared = `${node.original.replace(utils_1.PLACEHOLDER, "")}`;
    }
    else {
        prepared = node.original;
    }
    let result = prepared.split('.').map(el => {
        if (el === 'firstObject' || el === 'lastObject') {
            return `[0].`;
        }
        return el.includes('-') ? `["${el}"].` : `${el}.`;
    }).join('');
    result = result.replace(/\.\[/gi, '[');
    if (result.endsWith('.')) {
        result = result.slice(0, -1);
    }
    return result;
}
exports.normalizePathOriginal = normalizePathOriginal;
function transformPathExpression(node, key, { getItemScopes, tailForGlobalScope, pathsForGlobalScope, importNameForItem, componentImport, declaredInScope, addImport, addComponentImport, getPathScopes, yields, componentsForImport, globalScope, blockPaths, globalRegistry }) {
    let result = "";
    let simpleResult = "";
    const builtinScopeImports = new Set();
    if (node.head.type === 'AtHead') {
        result = exports.transform.wrapToFunction(normalizePathOriginal(node), key);
    }
    else if (node.head.type === 'ThisHead') {
        result = exports.transform.fn(componentImport ? "" : "this: null", normalizePathOriginal(node), key);
    }
    else {
        const { foundKey, scopeKey, scopeChain } = getPathScopes(node, key);
        if (foundKey === "globalScope") {
            if (!(scopeKey in globalScope)) {
                if (blockPaths.includes(key)) {
                    if (declaredInScope(scopeKey)) {
                        globalScope[scopeKey] = "AbstractBlockHelper";
                        builtinScopeImports.add('AbstractBlockHelper');
                    }
                    else {
                        globalScope[scopeKey] = 'undefined';
                    }
                    if (scopeKey in globalRegistry &&
                        componentsForImport.includes(scopeKey)) {
                        addComponentImport(scopeKey, globalRegistry[scopeKey]);
                    }
                }
                else {
                    if (scopeKey in globalRegistry) {
                        addImport(scopeKey, globalRegistry[scopeKey]);
                        globalScope[scopeKey] = importNameForItem(scopeKey);
                    }
                    else {
                        if (declaredInScope(scopeKey)) {
                            globalScope[scopeKey] = "AbstractHelper";
                            builtinScopeImports.add('AbstractHelper');
                        }
                        else {
                            globalScope[scopeKey] = 'undefined';
                        }
                    }
                }
            }
            if (pathsForGlobalScope[scopeKey]) {
                simpleResult = `this.globalScope["${scopeKey}"]`;
                result = exports.transform.fn(pathsForGlobalScope[scopeKey], `this.globalScope["${scopeKey}"]${tailForGlobalScope[scopeKey]
                    ? tailForGlobalScope[scopeKey]
                    : "(params, hash)"}`, key);
                if (scopeKey === "yield") {
                    const scopes = getItemScopes(key);
                    const slosestScope = scopes[0];
                    if (!slosestScope) {
                        console.log("unable to find scope for " + key);
                    }
                    else {
                        yields.push(slosestScope[0]);
                    }
                }
            }
            else {
                if (scopeKey in globalRegistry &&
                    componentsForImport.includes(scopeKey)) {
                    addComponentImport(scopeKey, globalRegistry[scopeKey]);
                    result = exports.transform.fn(`_, hash: typeof ${importNameForItem(scopeKey)}.prototype.args`, `let klass = new ${importNameForItem(scopeKey)}(this as unknown, hash); klass.args = hash; return klass.defaultYield()`, key);
                }
                else {
                    simpleResult = `this.globalScope["${scopeKey}"]`;
                    result = exports.transform.fn("params?, hash?", `this.globalScope["${scopeKey}"](params, hash)`, key);
                }
            }
        }
        else {
            if (scopeChain.length) {
                result = exports.transform.fn("", `this["${foundKey[0]}"]()[${foundKey[1]}].${scopeChain.join(".")}`, key);
            }
            else {
                result = exports.transform.fn("", `this["${foundKey[0]}"]()[${foundKey[1]}]`, key);
            }
        }
    }
    return { result, simpleResult, builtinScopeImports: Array.from(builtinScopeImports) };
}
exports.transformPathExpression = transformPathExpression;
exports.transform = {
    klass: {},
    support(node) {
        return node.type in this;
    },
    transform(node, key, klass) {
        if (klass) {
            this.klass = klass;
        }
        else {
            this.klass = {};
        }
        const typeKey = `TypeFor${node.type}`;
        const typings = (typeKey in this) ? ': ' + this[typeKey](node) : '';
        return this._wrap(this[node.type](node), key, typings);
    },
    wrapToFunction(str, key) {
        return this._wrap(str, key);
    },
    addMark(key) {
        return `/*@path-mark ${serializeKey(key)}*/`;
    },
    _wrap(str, key, returnType = '') {
        return `()${returnType} { return ${str}; ${this.addMark(key)}}`;
    },
    fn(args, body, key) {
        return this._makeFn(args, body, key);
    },
    _makeFn(rawArgs, rawBody, key) {
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
        return `"${node.chars}"`;
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
        }
        else if (!hash.length && params.length) {
            result = `${this.pathCall(node.path)}([${params}])`;
        }
        else if (hash.length && !params.length) {
            result = `${this.pathCall(node.path)}([],{${hash}})`;
        }
        else {
            if (nodeType === 'BlockStatement') {
                result = `${this.pathCall(node.path)}([], {})`;
            }
            else {
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
    TypeForUndefinedLiteral() {
        return `undefined`;
    },
    TypeForBooleanLiteral() {
        return `boolean`;
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
//# sourceMappingURL=hbs-transform.js.map