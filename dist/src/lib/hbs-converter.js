"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const syntax_1 = require("@glimmer/syntax");
function getClassMeta(source) {
    const node = syntax_1.preprocess(source);
    const nodes = [];
    syntax_1.traverse(node, {
        MustacheStatement(node) {
            nodes.push([node]);
        },
        BlockStatement(node) {
            nodes.push([node]);
        },
        SubExpression(node) {
            nodes[nodes.length - 1].push(node);
        }
    });
    return nodes;
}
exports.getClassMeta = getClassMeta;
function positionForItem(item) {
    const { start, end } = item.loc;
    return `${start.line},${start.column}:${end.line},${end.column}`;
}
exports.positionForItem = positionForItem;
function keyForItem(item) {
    return `${positionForItem(item)} - ${item.type}`;
}
exports.keyForItem = keyForItem;
function getClass(items, componentImport) {
    const methods = {};
    const klass = {};
    const blockPaths = [];
    function serializeKey(key) {
        return key.split(' - ')[0];
    }
    const parents = {};
    const scopes = {};
    function addChilds(items, key) {
        items.forEach(item => {
            if (item.type === "MustacheStatement" || item.type === "BlockStatement") {
                parents[key].push(keyForItem(item));
            }
            addChilds(item.program ? item.program.body : item.children || [], key);
        });
    }
    items.slice(0).forEach(b => {
        let n = b.slice(0);
        let pointer = null;
        while (n.length) {
            let exp = n.shift();
            const key = keyForItem(exp);
            if (!pointer) {
                pointer = key;
                parents[pointer] = [];
                scopes[pointer] = exp.program ? exp.program.blockParams : [];
                addChilds(exp.program ? exp.program.body : exp.children || [], pointer);
            }
            klass[key] = exp;
            let struct = {
                path: {
                    key: keyForItem(exp.path),
                    item: exp.path
                },
                item: exp,
                methods: [],
                hash: {},
                key: key
            };
            klass[keyForItem(exp.path)] = exp.path;
            if (exp.type === 'BlockStatement') {
                blockPaths.push(keyForItem(exp.path));
            }
            parents[pointer].push(keyForItem(exp.path));
            exp.params.forEach(p => {
                klass[keyForItem(p)] = p;
                parents[pointer].push(keyForItem(p));
                struct.methods.push([keyForItem(p), p]);
            });
            exp.hash.pairs.forEach(p => {
                klass[keyForItem(p.value)] = p.value;
                parents[pointer].push(keyForItem(p.value));
                struct.hash[p.key] = {
                    item: p.value,
                    key: keyForItem(p.value)
                };
            });
            if (exp.type !== "SubExpression") {
                methods[key] = struct;
            }
            else {
                methods[pointer].item.params.forEach(el => {
                    if (el === struct.item) {
                        methods[pointer].methods.push(struct);
                    }
                });
                methods[pointer].item.hash.pairs.forEach(el => {
                    if (el.value === struct.item) {
                        methods[pointer].hash[el.key] = struct;
                    }
                });
            }
        }
    });
    const pathsForGlobalScope = {
        'each': "<T>(params: ArrayLike<T>[], hash?)",
        'let': "<T>(params: ArrayLike<T>, hash?)",
        'array': "<T>(params: ArrayLike<T>, hash?)",
        'hash': "<T>(params: = [], hash: T)",
        'if': "<T,U,Y>([a,b,c]:[T?,U?,Y?], hash?)"
    };
    const tailForGlobalScope = {
        "if": "([a as T,b as U,c as Y], hash)"
    };
    const globalScope = {
        ["each"]: 'EachHelper',
        ["let"]: "LetHelper",
        ["hash"]: "HashHelper",
        ["array"]: "ArrayHelper",
        ["if"]: "typeof TIfHeper"
    };
    function getItemScopes(key, itemScopes = []) {
        let p = Object.keys(parents);
        let parent = null;
        p.forEach(pid => {
            if (parents[pid].includes(key)) {
                parent = pid;
            }
        });
        if (parent) {
            itemScopes.push([parent, scopes[parent]]);
            return getItemScopes(parent, itemScopes);
        }
        return itemScopes;
    }
    Object.keys(klass).forEach(key => {
        if (klass[key].type === "NumberLiteral") {
            klass[key] = `() { return ${klass[key].value}; }`;
        }
        else if (klass[key].type === "StringLiteral") {
            klass[key] = `() { return "${klass[key].value}"; }`;
        }
        else if (klass[key].type === "NullLiteral") {
            klass[key] = `() { return null; }`;
        }
        else if (klass[key].type === "BooleanLiteral") {
            klass[key] = `() { return ${klass[key].value === true ? "true" : "false"}; }`;
        }
        else if (klass[key].type === "UndefinedLiteral") {
            klass[key] = `() { return undefined; }`;
        }
        else if (klass[key].type === "PathExpression") {
            if (klass[key].data === true) {
                klass[key] = `() { return this.args.${klass[key].original.replace('ELSCompletionDummy', '')}; /*@path-mark ${serializeKey(key)}*/}`;
            }
            else if (klass[key].this === true) {
                klass[key] = `() { return ${klass[key].original.replace('ELSCompletionDummy', '')}; /*@path-mark ${serializeKey(key)}*/}`;
            }
            else {
                const scopeChain = klass[key].original.replace('ELSCompletionDummy', '').split('.');
                const scopeKey = scopeChain.shift();
                const itemScopes = getItemScopes(key);
                let foundKey = "globalScope";
                for (let i = 0; i < itemScopes.length; i++) {
                    let index = itemScopes[i][1].indexOf(scopeKey);
                    if (index > -1) {
                        foundKey = [itemScopes[i][0], index];
                        break;
                    }
                }
                if (foundKey === "globalScope") {
                    if (!(scopeKey in globalScope)) {
                        if (blockPaths.includes(key)) {
                            globalScope[scopeKey] = 'AbstractBlockHelper';
                        }
                        else {
                            globalScope[scopeKey] = 'AbstractHelper';
                        }
                    }
                    if (pathsForGlobalScope[scopeKey]) {
                        klass[key] = `${pathsForGlobalScope[scopeKey]} { return this.globalScope["${scopeKey}"]${tailForGlobalScope[scopeKey] ? tailForGlobalScope[scopeKey] : "(params, hash)"}; /*@path-mark ${serializeKey(key)}*/}`;
                    }
                    else {
                        klass[key] = `(params?, hash?) { return this.globalScope["${scopeKey}"](params, hash); /*@path-mark ${serializeKey(key)}*/}`;
                    }
                }
                else {
                    if (scopeChain.length) {
                        klass[key] = `(params = [], hash = {}) { return this["${foundKey[0]}"]()[${foundKey[1]}].${scopeChain.join('.')}; /*@path-mark ${serializeKey(key)}*/}`;
                    }
                    else {
                        klass[key] = `(params = [], hash = {}) { return this["${foundKey[0]}"]()[${foundKey[1]}]; /*@path-mark ${serializeKey(key)}*/}`;
                    }
                }
            }
        }
    });
    Object.keys(klass).forEach(key => {
        if (klass[key].type === "SubExpression" ||
            klass[key].type === "MustacheStatement" ||
            klass[key].type === "BlockStatement") {
            //   if (klass[key].type === "BlockStatement") {
            //     if (exp.type === 'BlockStatement') {
            //         struct.scope = exp.program.blockParams;
            //     }
            //   }
            const params = klass[key].params
                .map(p => {
                return `this["${keyForItem(p)}"]()`;
            })
                .join(",");
            const hash = klass[key].hash.pairs
                .map(p => {
                return `${p.key}:this["${keyForItem(p.value)}"]()`;
            })
                .join(",");
            if (hash.length && params.length) {
                klass[key] = `() {
                      return this["${keyForItem(klass[key].path)}"]([${params}],{${hash}});
                  }`;
            }
            else if (!hash.length && params.length) {
                klass[key] = `() {
                      return this["${keyForItem(klass[key].path)}"]([${params}]);
                  }`;
            }
            else if (hash.length && !params.length) {
                klass[key] = `() {
                      return this["${keyForItem(klass[key].path)}"]([],{${hash}});
                  }`;
            }
            else {
                klass[key] = `() {
                      return this["${keyForItem(klass[key].path)}"]();
                  }`;
            }
        }
    });
    let klssTpl = `

  type EachHelper = <T>([items]:ArrayLike<T>[], hash?) =>  [T, number];
  type LetHelper = <T>(items:ArrayLike<T>, hash?) => ArrayLike<T>;
  type AbstractHelper = <T>([items]:T[], hash?) => T;
  type AbstractBlockHelper = <T>([items]:ArrayLike<T>[], hash?) => [T];
  type HashHelper = <T>(items: any[], hash: T) => T;
  type ArrayHelper =  <T>(items:ArrayLike<T>, hash?) => ArrayLike<T>;

  function TIfHeper<T,U,Y>([a,b,c]:[T,U?,Y?], hash?) {
    return !!a ? b : c;
  }
  
  interface IKnownScope {
    ${Object.keys(globalScope)
        .map(key => {
        return `["${key}"]:${globalScope[key]};`;
    })
        .join("\n")}
  }
  
  interface IGlobalScope {
    [key: string ]: AbstractHelper | AbstractBlockHelper
  }
  
  type GlobalScope = IGlobalScope & IKnownScope;

  import Component from "${componentImport}";

      export default class Template extends Component {
          globalScope:  GlobalScope;
          ${Object.keys(klass)
        .map(key => {
        return `
              //@mark [${serializeKey(key)}]
              "${key}"${klass[key]};`;
    })
        .join("\n")}
      }
      
      `;
    return klssTpl;
}
exports.getClass = getClass;
//# sourceMappingURL=hbs-converter.js.map