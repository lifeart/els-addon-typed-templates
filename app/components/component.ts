import Component from '@glimmer/component';
type Args = {
    userId: string,
    userEmail: string
}
export default class MyComponent extends Component {
    public arr?: readonly number[];
    args!: Args;
    foo?: {
        bar?: {
            arr?: readonly number[];
        }
    }
    name = 1;
    noob = 2;
    items = [1, 2, 3];
    userName 
        = 3;
    names() {
        
    }
    item = {
        name: 'boo',
        user: {
            pets: 12
        },
        age: 42
    }
}