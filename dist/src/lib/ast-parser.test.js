"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ast_parser_1 = require("./ast-parser");
function getClassMeta(src) {
    return ast_parser_1.getClassMeta(src).nodes;
}
describe('getClassMeta', () => {
    it('able to hande wrong hbs', () => {
        expect(getClassMeta('\}}').length).toEqual(0);
    });
    it('able to handle pure mustache', () => {
        expect(getClassMeta('{{foo}}').length).toEqual(1);
    });
    it('able to handle modifiers', () => {
        expect(getClassMeta('<input {{foo}} >').length).toEqual(1);
    });
    it('able to handle blocks', () => {
        expect(getClassMeta('{{#foo}}{{/foo}}').length).toEqual(1);
    });
    it('able to handle block components', () => {
        expect(getClassMeta('<Boo as |a|></Boo>').length).toEqual(1);
    });
    it('able to handle pure mustache with subexp', () => {
        expect(getClassMeta('{{foo (bar)}}')[0].length).toEqual(2);
    });
    it('able to handle modifiers with subexp', () => {
        expect(getClassMeta('<input {{foo (bar)}} >')[0].length).toEqual(2);
    });
    it('able to handle blocks with subexp', () => {
        expect(getClassMeta('{{#foo (bar)}}{{/foo}}')[0].length).toEqual(2);
    });
});
describe('cleanComment', () => {
    it('able to remove script tag from comment', () => {
        expect(ast_parser_1.cleanComment(`<script>foo</script>`)).toEqual('foo');
    });
    it('able to remove js comment from line', () => {
        expect(ast_parser_1.cleanComment(` @ts-ignore // foo`)).toEqual('@ts-ignore');
    });
    it('able to remove js comment from multi line', () => {
        expect(ast_parser_1.cleanComment(`
        @ts-ignore // foo
        @ts-ignore // foo
        @ts-ignore // foo
        `)).toEqual(new Array(3).fill('@ts-ignore').join('\n'));
    });
});
//# sourceMappingURL=ast-parser.test.js.map