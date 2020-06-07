import { relativeImport } from './resolvers';

describe('relativeImport', () => {
    it('works', ()=>{
        expect(relativeImport('/foo/bar/baz', '/foo/bar/baz/boo.js')).toEqual('boo');
        expect(relativeImport('/foo/bar/baz', '/foo/bar/baz/boo.ts')).toEqual('boo');
        expect(relativeImport('/foo/bar/baz', '/foo/bar/baz/boo.d.ts')).toEqual('boo');
    });
});