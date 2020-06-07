"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const resolvers_1 = require("./resolvers");
describe('relativeImport', () => {
    it('works', () => {
        expect(resolvers_1.relativeImport('/foo/bar/baz', '/foo/bar/baz/boo.js')).toEqual('boo');
        expect(resolvers_1.relativeImport('/foo/bar/baz', '/foo/bar/baz/boo.ts')).toEqual('boo');
        expect(resolvers_1.relativeImport('/foo/bar/baz', '/foo/bar/baz/boo.d.ts')).toEqual('boo');
    });
});
//# sourceMappingURL=resolvers.test.js.map