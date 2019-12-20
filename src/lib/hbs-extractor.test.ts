import { getClassMeta } from './ast-parser';
import { extractRelationships } from './hbs-extractor';

function results(source) {
    let items = extractRelationships(getClassMeta(source).nodes);
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
    cases.forEach((str)=>{
        it(str, ()=>{
            expect(results(str)).toMatchSnapshot();
        });
    });
});