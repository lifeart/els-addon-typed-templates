"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractRelationships = void 0;
const hbs_transform_1 = require("./hbs-transform");
const ast_helpers_1 = require("./ast-helpers");
const ts_service_1 = require("./ts-service");
function extractRelationships(items, projectRoot) {
    let registry = {
        component: {},
        helper: {}
    };
    const server = ts_service_1.serverForProject(projectRoot);
    if (server) {
        registry = server.getRegistry(projectRoot);
    }
    let isComponent = (name) => {
        return name in registry.component;
    };
    // projectRoot
    const componentsForImport = [];
    const parents = {};
    const scopes = {};
    const klass = {};
    const blockPaths = [];
    function addChilds(items, key) {
        items.forEach(item => {
            if (item.type === "MustacheStatement" || item.type === "BlockStatement") {
                parents[key].push(hbs_transform_1.keyForItem(item));
            }
            else if (item.type === "ElementNode") {
                if (ast_helpers_1.isSimpleBlockComponentElement(item)) {
                    parents[key].push(hbs_transform_1.keyForItem({
                        type: 'BlockStatement',
                        loc: item.loc
                    }));
                }
                item.modifiers.forEach(mod => {
                    parents[key].push(hbs_transform_1.keyForItem(mod));
                });
                item.attributes.forEach((attr) => {
                    if (attr.value.type === 'ConcatStatement') {
                        attr.value.parts.forEach((part) => {
                            if (part.type === 'MustacheStatement') {
                                addChilds([part], key);
                                parents[key].push(hbs_transform_1.keyForItem(part));
                            }
                        });
                    }
                    else if (attr.value.type === 'MustacheStatement') {
                        addChilds([attr.value], key);
                        parents[key].push(hbs_transform_1.keyForItem(attr.value));
                    }
                });
            }
            addChilds(item.program ? item.program.body : item.children || [], key);
            if (item.inverse) {
                addChilds(item.inverse.body || [], key);
            }
            if (item.hash) {
                item.hash.pairs.forEach(attr => {
                    if (attr.value.type === 'ConcatStatement') {
                        attr.value.parts.forEach((part) => {
                            if (part.type === 'MustacheStatement') {
                                addChilds([part], key);
                                parents[key].push(hbs_transform_1.keyForItem(part));
                            }
                        });
                    }
                    else if (attr.value.type === 'MustacheStatement') {
                        addChilds([attr.value], key);
                        parents[key].push(hbs_transform_1.keyForItem(attr.value));
                    }
                });
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
                if (exp.blockParams) {
                    scopes[pointer] = exp.blockParams;
                }
                else {
                    scopes[pointer] = exp.program ? (exp.program.blockParams || []) : [];
                }
            }
            if (!(key in parents)) {
                parents[key] = [];
            }
            addChilds(exp.program ? exp.program.body : exp.children || [], pointer);
            addChilds(exp.inverse ? exp.inverse.body : [], pointer);
            parents[key].push(hbs_transform_1.keyForItem(exp.path));
            klass[key] = exp;
            klass[hbs_transform_1.keyForItem(exp.path)] = exp.path;
            if (exp.type === "BlockStatement") {
                blockPaths.push(hbs_transform_1.keyForItem(exp.path));
                if (exp.isComponent) {
                    componentsForImport.push(exp.path.original);
                }
            }
            else if (exp.type === "MustacheStatement") {
                if (exp.path.type === 'PathExpression') {
                    if (isComponent(exp.path.original)) {
                        componentsForImport.push(exp.path.original);
                    }
                }
            }
            exp.params && exp.params.forEach(p => {
                klass[hbs_transform_1.keyForItem(p)] = p;
                parents[pointer].push(hbs_transform_1.keyForItem(p));
            });
            exp.hash && exp.hash.pairs.forEach(p => {
                klass[hbs_transform_1.keyForItem(p.value)] = p.value;
                parents[pointer].push(hbs_transform_1.keyForItem(p.value));
            });
        }
    });
    return {
        componentsForImport,
        parents,
        scopes,
        klass,
        blockPaths
    };
}
exports.extractRelationships = extractRelationships;
//# sourceMappingURL=hbs-extractor.js.map