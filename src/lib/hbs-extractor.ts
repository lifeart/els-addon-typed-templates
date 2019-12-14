import { keyForItem } from "./hbs-transform";

export function extractRelationships(items) {
  const componentsForImport: string[] = [];
  const parents = {};
  const scopes = {};
  const klass = {};
  const methods = {};
  const blockPaths: any = [];
  function addChilds(items, key) {
    items.forEach(item => {
      if (item.type === "MustacheStatement" || item.type === "BlockStatement") {
        parents[key].push(keyForItem(item));
      } else if (item.type === "ElementNode") {
        item.modifiers.forEach(mod => {
          parents[key].push(keyForItem(mod));
        });
      }
      addChilds(item.program ? item.program.body : item.children || [], key);
      if (item.inverse) {
        addChilds(item.inverse.body || [], key);
      }
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
        addChilds(exp.inverse ? exp.inverse.body : [], pointer);
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
      if (exp.type === "BlockStatement") {
        blockPaths.push(keyForItem(exp.path));
        if (exp.isComponent) {
          componentsForImport.push(exp.path.original);
        }
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

  return {
    componentsForImport,
    parents,
    scopes,
    klass,
    methods,
    blockPaths
  }
}
