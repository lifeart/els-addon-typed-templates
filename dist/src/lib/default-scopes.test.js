"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const default_scopes_1 = require("./default-scopes");
describe('defaultScopes', () => {
    it('return expected list of objects', () => {
        expect(Object.keys(default_scopes_1.defaultScopes())).toMatchSnapshot();
    });
});
//# sourceMappingURL=default-scopes.test.js.map