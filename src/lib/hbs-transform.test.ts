import { positionForItem, keyForItem, transform, normalizePathOriginal } from './hbs-transform';
import { builders as b } from '@glimmer/syntax';

function t(a,b = keyForItem(a),c?) {
    return transform.transform(a, b, c);
}


function w(a: string) {
    const p = b.path(a);
    return transform.wrapToFunction(normalizePathOriginal(p), keyForItem(p));
}

describe('positionForItem', () => {
    it('return correct position from given location', ()=>{
        expect(positionForItem({
            loc: {
                start: {line: 0, column: 3},
                end: {line: 2, column: 5}
            }
        })).toEqual('0,3:2,5');
    });
});

describe('keyForItem', () => {
    it('return correct key from given node', ()=>{

        expect(keyForItem({
            loc: {
                start: {line: 0, column: 3},
                end: {line: 2, column: 5}
            },
            type: 'FooBar'
        })).toEqual('0,3:2,5 - FooBar');
    });
});

describe('transform', () => {
    
    describe('NumberLiteral', () => {
        it('+ 42', () => {
            expect(t(b.number(42))).toEqual('(): 42 { return 42; /*@path-mark 1,0:1,0*/}');
        });
        it('- 42', () => {
            expect(t(b.number(-42))).toEqual('(): -42 { return -42; /*@path-mark 1,0:1,0*/}');
        });
    });
    describe('StringLiteral', () => {
        it('"foo"', () => {
            expect(t(b.string("foo"))).toEqual("(): \"foo\" { return \"foo\"; /*@path-mark 1,0:1,0*/}");
        });
        it('"foo.bar"', () => {
            expect(t(b.string("foo.bar"))).toEqual("(): \"foo.bar\" { return \"foo.bar\"; /*@path-mark 1,0:1,0*/}");
        });
        it('"foo-bar"', () => {
            expect(t(b.string("foo-bar"))).toEqual("(): \"foo-bar\" { return \"foo-bar\"; /*@path-mark 1,0:1,0*/}");
        });
        it('empty: "', () => {
            expect(t(b.string(""))).toEqual("(): \"\" { return \"\"; /*@path-mark 1,0:1,0*/}");
        });
        it('escaped string literal', () => {
            expect(t(b.string("\"asd\""))).toEqual("(): \"\\\"asd\\\"\" { return \"\\\"asd\\\"\"; /*@path-mark 1,0:1,0*/}");
        });
    });
    describe('TextLiteral', () => {
        it('"foo"', () => {
            expect(t(b.text("foo"))).toEqual("(): \"foo\" { return \"foo\"; /*@path-mark 1,0:1,0*/}");
        });
        it('"foo.bar"', () => {
            expect(t(b.text("foo.bar"))).toEqual("(): \"foo.bar\" { return \"foo.bar\"; /*@path-mark 1,0:1,0*/}");
        });
        it('"foo-bar"', () => {
            expect(t(b.text("foo-bar"))).toEqual("(): \"foo-bar\" { return \"foo-bar\"; /*@path-mark 1,0:1,0*/}");
        });
        it('empty: "', () => {
            expect(t(b.text(""))).toEqual("(): \"\" { return \"\"; /*@path-mark 1,0:1,0*/}");
        });
    });
    describe('NullLiteral', () => {
        it('transform it', () => {
            expect(t(b.null())).toEqual("(): null { return null; /*@path-mark 1,0:1,0*/}");
        });
    });
    describe('UndefinedLiteral', () => {
        it('transform it', () => {
            expect(t(b.undefined())).toEqual("(): undefined { return undefined; /*@path-mark 1,0:1,0*/}");
        });
    })
    describe('BooleanLiteral', () => {
        it('transform true', () => {
            expect(t(b.boolean(true))).toEqual("(): boolean { return true; /*@path-mark 1,0:1,0*/}");
        });
        it('transform false', () => {
            expect(t(b.boolean(false))).toEqual("(): boolean { return false; /*@path-mark 1,0:1,0*/}");
        });
    })
    describe('BlockStatement', () => {
        it('works with local blocks without hash and params', () => {
            expect(t(b.block(b.path('this.foo'), [], b.hash([]), b.blockItself()))).toEqual('() { return this[\"1,0:1,0 - PathExpression\"]([], {}); /*@path-mark 1,0:1,0*/}');
        });
        it('works with local blocks with hash and without params', () => {
            expect(t(b.block(b.path('this.foo'), [], b.hash([b.pair('foo', b.number(1))]), b.blockItself()))).toEqual("() { return this[\"1,0:1,0 - PathExpression\"]([],{'foo':this[\"1,0:1,0 - NumberLiteral\"]()}); /*@path-mark 1,0:1,0*/}");
        });
        it('works with local blocks without hash and with params', () => {
            expect(t(b.block(b.path('this.foo'), [b.string('foo')], b.hash(), b.blockItself()))).toEqual("() { return this[\"1,0:1,0 - PathExpression\"]([this[\"1,0:1,0 - StringLiteral\"]()]); /*@path-mark 1,0:1,0*/}");
        });
        it('works with local blocks with hash and params', () => {
            expect(t(b.block(b.path('this.foo'), [b.string('foo')], b.hash([b.pair('foo', b.number(1))]), b.blockItself()))).toEqual("() { return this[\"1,0:1,0 - PathExpression\"]([this[\"1,0:1,0 - StringLiteral\"]()],{'foo':this[\"1,0:1,0 - NumberLiteral\"]()}); /*@path-mark 1,0:1,0*/}");
        });
        
        it('works with data blocks without hash and params', () => {
            expect(t(b.block(b.path('@foo'), [], b.hash([]), b.blockItself()))).toEqual('() { return this[\"1,0:1,0 - PathExpression\"]([], {}); /*@path-mark 1,0:1,0*/}');
        });
        it('works with data blocks with hash and without params', () => {
            expect(t(b.block(b.path('@foo'), [], b.hash([b.pair('foo', b.number(1))]), b.blockItself()))).toEqual("() { return this[\"1,0:1,0 - PathExpression\"]([],{'foo':this[\"1,0:1,0 - NumberLiteral\"]()}); /*@path-mark 1,0:1,0*/}");
        });
        it('works with data blocks without hash and with params', () => {
            expect(t(b.block(b.path('@foo'), [b.string('foo')], b.hash(), b.blockItself()))).toEqual("() { return this[\"1,0:1,0 - PathExpression\"]([this[\"1,0:1,0 - StringLiteral\"]()]); /*@path-mark 1,0:1,0*/}");
        });
        it('works with data blocks with hash and params', () => {
            expect(t(b.block(b.path('@foo'), [b.string('foo')], b.hash([b.pair('foo', b.number(1))]), b.blockItself()))).toEqual("() { return this[\"1,0:1,0 - PathExpression\"]([this[\"1,0:1,0 - StringLiteral\"]()],{'foo':this[\"1,0:1,0 - NumberLiteral\"]()}); /*@path-mark 1,0:1,0*/}");
        });
    });
    describe('wrapToFunction', () => {
        it('works with paths', () => {
            expect(w('foo')).toEqual('() { return foo; /*@path-mark 1,0:1,0*/}');
        });
        it('works with local', () => {
            expect(w('this.foo')).toEqual('() { return this?.foo; /*@path-mark 1,0:1,0*/}');
        });
        it('works with data', () => {
            expect(w('@foo')).toEqual('() { return this.args?.foo; /*@path-mark 1,0:1,0*/}');
        });
        it('works with nested data', () => {
            expect(w('@foo.bar')).toEqual('() { return this.args?.foo?.bar; /*@path-mark 1,0:1,0*/}');
        });
    });
});

describe('normalizePathOriginal', () => {
    let p = (str) => normalizePathOriginal(b.path(str));
    it('works for global paths', () => {
        expect(p('foo')).toEqual('foo');
    });
    it('works for data paths', () => {
        expect(p('@foo')).toEqual('this.args?.foo');
    });
    it('works for local paths', () => {
        expect(p('this.foo')).toEqual('this?.foo');
    });
    it('works for paths with non-js syntax "foo-baz"', () => {
        expect(p('@foo.bar-baz')).toEqual('this.args?.foo?.["bar-baz"]');
    });
    it('works for paths with non-js syntax nested "foo-baz"', () => {
        expect(p('@foo.bar-baz.foo-bar')).toEqual('this.args?.foo?.["bar-baz"]?.["foo-bar"]');
    });
    it('works for paths with non-js syntax nested "foo-baz" and mixed cases', () => {
        expect(p('@foo.bar-baz.boo.foo-bar')).toEqual('this.args?.foo?.["bar-baz"]?.boo?.["foo-bar"]');
    });
    it('works for specific paths [firstObject]', () => {
        expect(p('this.firstObject')).toEqual('this?.[0]');
    });
    it('works for specific paths [lastObject]', () => {
        expect(p('this.lastObject')).toEqual('this?.[0]');
    });
    it('works for specific paths with nesting [lastObject]', () => {
        expect(p('this.lastObject.key.lastObject.boo')).toEqual('this?.[0]?.key?.[0]?.boo');
    });
});