"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hbs_transform_1 = require("./hbs-transform");
const syntax_1 = require("@glimmer/syntax");
function t(a, b = hbs_transform_1.keyForItem(a), c) {
    return hbs_transform_1.transform.transform(a, b, c);
}
function w(a) {
    const p = syntax_1.builders.path(a);
    return hbs_transform_1.transform.wrapToFunction(hbs_transform_1.normalizePathOriginal(p), hbs_transform_1.keyForItem(p));
}
describe('positionForItem', () => {
    it('return correct position from given location', () => {
        expect(hbs_transform_1.positionForItem({
            loc: {
                start: { line: 0, column: 3 },
                end: { line: 2, column: 5 }
            }
        })).toEqual('0,3:2,5');
    });
});
describe('keyForItem', () => {
    it('return correct key from given node', () => {
        expect(hbs_transform_1.keyForItem({
            loc: {
                start: { line: 0, column: 3 },
                end: { line: 2, column: 5 }
            },
            type: 'FooBar'
        })).toEqual('0,3:2,5 - FooBar');
    });
});
describe('transform', () => {
    describe('NumberLiteral', () => {
        it('+ 42', () => {
            expect(t(syntax_1.builders.number(42))).toEqual('(): 42 { return 42; /*@path-mark 1,0:1,0*/}');
        });
        it('- 42', () => {
            expect(t(syntax_1.builders.number(-42))).toEqual('(): -42 { return -42; /*@path-mark 1,0:1,0*/}');
        });
    });
    describe('StringLiteral', () => {
        it('"foo"', () => {
            expect(t(syntax_1.builders.string("foo"))).toEqual("(): \"foo\" { return \"foo\"; /*@path-mark 1,0:1,0*/}");
        });
        it('"foo.bar"', () => {
            expect(t(syntax_1.builders.string("foo.bar"))).toEqual("(): \"foo.bar\" { return \"foo.bar\"; /*@path-mark 1,0:1,0*/}");
        });
        it('"foo-bar"', () => {
            expect(t(syntax_1.builders.string("foo-bar"))).toEqual("(): \"foo-bar\" { return \"foo-bar\"; /*@path-mark 1,0:1,0*/}");
        });
        it('empty: "', () => {
            expect(t(syntax_1.builders.string(""))).toEqual("(): \"\" { return \"\"; /*@path-mark 1,0:1,0*/}");
        });
        it('escaped string literal', () => {
            expect(t(syntax_1.builders.string("\"asd\""))).toEqual("(): \"\\\"asd\\\"\" { return \"\\\"asd\\\"\"; /*@path-mark 1,0:1,0*/}");
        });
    });
    describe('TextLiteral', () => {
        it('"foo"', () => {
            expect(t(syntax_1.builders.text("foo"))).toEqual("(): \"foo\" { return \"foo\"; /*@path-mark 1,0:1,0*/}");
        });
        it('"foo.bar"', () => {
            expect(t(syntax_1.builders.text("foo.bar"))).toEqual("(): \"foo.bar\" { return \"foo.bar\"; /*@path-mark 1,0:1,0*/}");
        });
        it('"foo-bar"', () => {
            expect(t(syntax_1.builders.text("foo-bar"))).toEqual("(): \"foo-bar\" { return \"foo-bar\"; /*@path-mark 1,0:1,0*/}");
        });
        it('empty: "', () => {
            expect(t(syntax_1.builders.text(""))).toEqual("(): \"\" { return \"\"; /*@path-mark 1,0:1,0*/}");
        });
    });
    describe('NullLiteral', () => {
        it('transform it', () => {
            expect(t(syntax_1.builders.null())).toEqual("(): null { return null; /*@path-mark 1,0:1,0*/}");
        });
    });
    describe('UndefinedLiteral', () => {
        it('transform it', () => {
            expect(t(syntax_1.builders.undefined())).toEqual("(): undefined { return undefined; /*@path-mark 1,0:1,0*/}");
        });
    });
    describe('BooleanLiteral', () => {
        it('transform true', () => {
            expect(t(syntax_1.builders.boolean(true))).toEqual("(): boolean { return true; /*@path-mark 1,0:1,0*/}");
        });
        it('transform false', () => {
            expect(t(syntax_1.builders.boolean(false))).toEqual("(): boolean { return false; /*@path-mark 1,0:1,0*/}");
        });
    });
    describe('BlockStatement', () => {
        it('works with local blocks without hash and params', () => {
            expect(t(syntax_1.builders.block(syntax_1.builders.path('this.foo'), [], syntax_1.builders.hash([]), syntax_1.builders.blockItself()))).toEqual('() { return this[\"1,0:1,0 - PathExpression\"]([], {}); /*@path-mark 1,0:1,0*/}');
        });
        it('works with local blocks with hash and without params', () => {
            expect(t(syntax_1.builders.block(syntax_1.builders.path('this.foo'), [], syntax_1.builders.hash([syntax_1.builders.pair('foo', syntax_1.builders.number(1))]), syntax_1.builders.blockItself()))).toEqual("() { return this[\"1,0:1,0 - PathExpression\"]([],{'foo':this[\"1,0:1,0 - NumberLiteral\"]()}); /*@path-mark 1,0:1,0*/}");
        });
        it('works with local blocks without hash and with params', () => {
            expect(t(syntax_1.builders.block(syntax_1.builders.path('this.foo'), [syntax_1.builders.string('foo')], syntax_1.builders.hash(), syntax_1.builders.blockItself()))).toEqual("() { return this[\"1,0:1,0 - PathExpression\"]([this[\"1,0:1,0 - StringLiteral\"]()]); /*@path-mark 1,0:1,0*/}");
        });
        it('works with local blocks with hash and params', () => {
            expect(t(syntax_1.builders.block(syntax_1.builders.path('this.foo'), [syntax_1.builders.string('foo')], syntax_1.builders.hash([syntax_1.builders.pair('foo', syntax_1.builders.number(1))]), syntax_1.builders.blockItself()))).toEqual("() { return this[\"1,0:1,0 - PathExpression\"]([this[\"1,0:1,0 - StringLiteral\"]()],{'foo':this[\"1,0:1,0 - NumberLiteral\"]()}); /*@path-mark 1,0:1,0*/}");
        });
        it('works with data blocks without hash and params', () => {
            expect(t(syntax_1.builders.block(syntax_1.builders.path('@foo'), [], syntax_1.builders.hash([]), syntax_1.builders.blockItself()))).toEqual('() { return this[\"1,0:1,0 - PathExpression\"]([], {}); /*@path-mark 1,0:1,0*/}');
        });
        it('works with data blocks with hash and without params', () => {
            expect(t(syntax_1.builders.block(syntax_1.builders.path('@foo'), [], syntax_1.builders.hash([syntax_1.builders.pair('foo', syntax_1.builders.number(1))]), syntax_1.builders.blockItself()))).toEqual("() { return this[\"1,0:1,0 - PathExpression\"]([],{'foo':this[\"1,0:1,0 - NumberLiteral\"]()}); /*@path-mark 1,0:1,0*/}");
        });
        it('works with data blocks without hash and with params', () => {
            expect(t(syntax_1.builders.block(syntax_1.builders.path('@foo'), [syntax_1.builders.string('foo')], syntax_1.builders.hash(), syntax_1.builders.blockItself()))).toEqual("() { return this[\"1,0:1,0 - PathExpression\"]([this[\"1,0:1,0 - StringLiteral\"]()]); /*@path-mark 1,0:1,0*/}");
        });
        it('works with data blocks with hash and params', () => {
            expect(t(syntax_1.builders.block(syntax_1.builders.path('@foo'), [syntax_1.builders.string('foo')], syntax_1.builders.hash([syntax_1.builders.pair('foo', syntax_1.builders.number(1))]), syntax_1.builders.blockItself()))).toEqual("() { return this[\"1,0:1,0 - PathExpression\"]([this[\"1,0:1,0 - StringLiteral\"]()],{'foo':this[\"1,0:1,0 - NumberLiteral\"]()}); /*@path-mark 1,0:1,0*/}");
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
    let p = (str) => hbs_transform_1.normalizePathOriginal(syntax_1.builders.path(str));
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
//# sourceMappingURL=hbs-transform.test.js.map