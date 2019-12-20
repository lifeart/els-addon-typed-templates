import { getClassMeta as classMeta } from './ast-parser';

function getClassMeta(src) {
    return classMeta(src).nodes;
}

describe('getClassMeta', () => {
    it('able to hande wrong hbs', ()=>{
        expect(getClassMeta('\}}').length).toEqual(0);
    });
    it('able to handle pure mustache', ()=>{
        expect(getClassMeta('{{foo}}').length).toEqual(1);
    });
    it('able to handle modifiers', ()=>{
        expect(getClassMeta('<input {{foo}} >').length).toEqual(1);
    });
    it('able to handle blocks', ()=>{
        expect(getClassMeta('{{#foo}}{{/foo}}').length).toEqual(1);
    });
    it('able to handle block components', ()=>{
        expect(getClassMeta('<Boo as |a|></Boo>').length).toEqual(1);
    });

    it('able to handle pure mustache with subexp', ()=>{
        expect(getClassMeta('{{foo (bar)}}')[0].length).toEqual(2);
    });
    it('able to handle modifiers with subexp', ()=>{
        expect(getClassMeta('<input {{foo (bar)}} >')[0].length).toEqual(2);
    });
    it('able to handle blocks with subexp', ()=>{
        expect(getClassMeta('{{#foo (bar)}}{{/foo}}')[0].length).toEqual(2);
    });
});