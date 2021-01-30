import { getClassMeta } from './ast-parser';
import { extractRelationships } from './hbs-extractor';

function results(source) {
    let items: any = extractRelationships(getClassMeta(source).nodes, '');
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

describe('getClassMeta - complex case', () => {
    expect(results(`
    {{#each @model.tagsList as |tag|}}
  <LinkTo
    @query={{hash tags=tag}}
  >
    {{tag}}
  </LinkTo>
{{/each}}
    `)).toMatchSnapshot();
})

describe('getClassMeta - simple scope', () => {
    expect(results(`{{#each @model.tagsList as |tag|}}
    {{tag}}
  {{/each}}`)).toMatchSnapshot();
})

describe('dash in path names', () => {
  expect(results(`{{@classNames.ui-wrapper}}`)).toMatchSnapshot();
})