"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hbs_transform_1 = require("./hbs-transform");
function extractRelationships(items) {
    const componentsForImport = [];
    const parents = {};
    const scopes = {};
    const klass = {};
    const methods = {};
    const blockPaths = [];
    function addChilds(items, key) {
        items.forEach(item => {
            if (item.type === "MustacheStatement" || item.type === "BlockStatement") {
                parents[key].push(hbs_transform_1.keyForItem(item));
            }
            else if (item.type === "ElementNode") {
                item.modifiers.forEach(mod => {
                    parents[key].push(hbs_transform_1.keyForItem(mod));
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
        let pointer = null;
        while (n.length) {
            let exp = n.shift();
            const key = hbs_transform_1.keyForItem(exp);
            if (!pointer) {
                pointer = key;
                parents[pointer] = [];
                scopes[pointer] = exp.program ? exp.program.blockParams : [];
                addChilds(exp.program ? exp.program.body : exp.children || [], pointer);
                addChilds(exp.inverse ? exp.inverse.body : [], pointer);
            }
            klass[key] = exp;
            let struct = {
                path: {
                    key: hbs_transform_1.keyForItem(exp.path),
                    item: exp.path
                },
                item: exp,
                methods: [],
                hash: {},
                key: key
            };
            klass[hbs_transform_1.keyForItem(exp.path)] = exp.path;
            if (exp.type === "BlockStatement") {
                blockPaths.push(hbs_transform_1.keyForItem(exp.path));
                if (exp.isComponent) {
                    componentsForImport.push(exp.path.original);
                }
            }
            parents[pointer].push(hbs_transform_1.keyForItem(exp.path));
            exp.params.forEach(p => {
                klass[hbs_transform_1.keyForItem(p)] = p;
                parents[pointer].push(hbs_transform_1.keyForItem(p));
                struct.methods.push([hbs_transform_1.keyForItem(p), p]);
            });
            exp.hash.pairs.forEach(p => {
                klass[hbs_transform_1.keyForItem(p.value)] = p.value;
                parents[pointer].push(hbs_transform_1.keyForItem(p.value));
                struct.hash[p.key] = {
                    item: p.value,
                    key: hbs_transform_1.keyForItem(p.value)
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
    return {
        componentsForImport,
        parents,
        scopes,
        klass,
        methods,
        blockPaths
    };
}
exports.extractRelationships = extractRelationships;
//# sourceMappingURL=hbs-extractor.js.map