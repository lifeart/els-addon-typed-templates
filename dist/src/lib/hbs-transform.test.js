"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hbs_transform_1 = require("./hbs-transform");
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
//# sourceMappingURL=hbs-transform.test.js.map