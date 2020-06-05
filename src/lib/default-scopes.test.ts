import { defaultScopes } from './default-scopes';

describe('defaultScopes', () => {
    it('return expected list of objects', ()=>{
        expect(Object.keys(defaultScopes())).toMatchSnapshot();
    });
});