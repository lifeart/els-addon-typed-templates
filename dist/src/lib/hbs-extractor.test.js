"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ast_parser_1 = require("./ast-parser");
const hbs_extractor_1 = require("./hbs-extractor");
function results(source) {
    let items = hbs_extractor_1.extractRelationships(ast_parser_1.getClassMeta(source).nodes);
    delete items.klass;
    return items;
}
describe('getClassMeta', () => {
    const cases = [
        '{{1}}',
        `{{"1"}}`,
        `{{foo}}`,
        `{{#let foo as |bar|}}{{bar}}{{/let}}`,
        '<MyComponent as |ctx|> {{ctx.result}} </MyComponent>',
        `{{foo this.bar baz=this.boo}}`,
        '<input {{foo-bar this.baz a="1"}}>',
        '<MyComponent as |ctx|>{{#let ctx.result as |bar|}}{{bar}}{{/let}}</MyComponent>',
    ];
    cases.forEach((str) => {
        it(str, () => {
            expect(results(str)).toMatchSnapshot();
        });
    });
});
//# sourceMappingURL=hbs-extractor.test.js.map