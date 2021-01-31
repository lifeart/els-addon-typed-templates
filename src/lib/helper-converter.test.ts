import { getHelper } from './helper-converter';
import * as path from 'path';

describe('getHelper', () => {
    it('it works', ()=>{
        expect(getHelper(path.join(__dirname, './../../app/helpers/filter-attrs.ts'))).toMatchSnapshot();
    })
});