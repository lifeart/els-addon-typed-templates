import { preprocess as parse, traverse } from "@glimmer/syntax";

export function getClassMeta(source) {
  const node = parse(source);
  const nodes: any = [];

  traverse(node, {
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

export function getClass(items, componentImport: string) {
  const methods = {};
  const klass = {};
  const blockPaths: any = [];
  function keyForItem(item) {
    const { start, end } = item.loc;
    return `${start.line},${start.column}:${end.line},${end.column} - ${item.type}`;
  }
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
    let pointer: any = null;
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

      let struct: any = {
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
      } else {
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

  const globalScope = {};

  function getItemScopes(key, itemScopes: any = []) {
    let p = Object.keys(parents);
    let parent: string | null = null;
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
    } else if (klass[key].type === "StringLiteral") {
      klass[key] = `() { return "${klass[key].value}"; }`;
    } else if (klass[key].type === "NullLiteral") {
      klass[key] = `() { return null; }`;
    } else if (klass[key].type === "BooleanLiteral") {
      klass[key] = `() { return ${
        klass[key].value === true ? "true" : "false"
      }; }`;
    } else if (klass[key].type === "UndefinedLiteral") {
      klass[key] = `() { return undefined; }`;
    } else if (klass[key].type === "PathExpression") {
      if (klass[key].data === true) {
        klass[key] = `() { return this.args.${klass[key].original}; }`;
      } else if (klass[key].this === true) {
        klass[key] = `() { return ${klass[key].original}; }`;
      } else {
        const scopeKey = klass[key].original;
        const itemScopes = getItemScopes(key);
        let foundKey: string | any[] = "globalScope";
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
              globalScope[scopeKey] = '(params, hash) { return []; }';
            } else {
              globalScope[scopeKey] = '(params, hash) { return ""; }';
            }
          }
          klass[
            key
          ] = `(params = [], hash = {}) { return this.globalScope["${scopeKey}"](params, hash); }`;
        } else {
          klass[
            key
          ] = `(params = [], hash = {}) { return this["${foundKey[0]}"]()[${foundKey[1]}](params, hash); }`;
        }
      }
    }
  });

  Object.keys(klass).forEach(key => {
    if (
      klass[key].type === "SubExpression" ||
      klass[key].type === "MustacheStatement" ||
      klass[key].type === "BlockStatement"
    ) {
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
                      return this["${keyForItem(
                        klass[key].path
                      )}"]([${params}],{${hash}});
                  }`;
      } else if (!hash.length && params.length) {
        klass[key] = `() {
                      return this["${keyForItem(
                        klass[key].path
                      )}"]([${params}]);
                  }`;
      } else {
        klass[key] = `() {
                      return this["${keyForItem(klass[key].path)}"]();
                  }`;
      }
    }
  });

  let klssTpl = `
  import Component from "${componentImport}";

      export default class Template extends Component {
          globalScope = {
              ${Object.keys(globalScope)
                .map(key => {
                  return `["${key}"]${globalScope[key]}`;
                })
                .join(",\n")}
          };
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
