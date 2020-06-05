import { positionForItem, keyForItem } from './hbs-transform';

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