"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ast_parser_1 = require("./ast-parser");
describe('getClassMeta', () => {
    it('able to hande wrong hbs', () => {
        expect(ast_parser_1.getClassMeta('\}}').length).toEqual(0);
    });
    it('able to handle pure mustache', () => {
        expect(ast_parser_1.getClassMeta('{{foo}}').length).toEqual(1);
    });
    it('able to handle modifiers', () => {
        expect(ast_parser_1.getClassMeta('<input {{foo}} >').length).toEqual(1);
    });
    it('able to handle blocks', () => {
        expect(ast_parser_1.getClassMeta('{{#foo}}{{/foo}}').length).toEqual(1);
    });
    it('able to handle block components', () => {
        expect(ast_parser_1.getClassMeta('<Boo as |a|></Boo>').length).toEqual(1);
    });
    it('able to handle pure mustache with subexp', () => {
        expect(ast_parser_1.getClassMeta('{{foo (bar)}}')[0].length).toEqual(2);
    });
    it('able to handle modifiers with subexp', () => {
        expect(ast_parser_1.getClassMeta('<input {{foo (bar)}} >')[0].length).toEqual(2);
    });
    it('able to handle blocks with subexp', () => {
        expect(ast_parser_1.getClassMeta('{{#foo (bar)}}{{/foo}}')[0].length).toEqual(2);
    });
});
//# sourceMappingURL=ast-parser.test.js.map