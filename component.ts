import Component from '@glimmer/component';
export default class MyComponent extends Component {
    name = 1;
    noob = 2;
    names() {
        return 1;
    }
    item = {
        name: 'boo',
        age: 42
    }
}