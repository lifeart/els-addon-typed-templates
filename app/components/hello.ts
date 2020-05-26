import Component from '@glimmer/component';

interface Args  {
    foo: number;
    boo: string;
}



export default class Hello extends Component<Args> {
    world = 'Yes'
    users = {
        foo: 1
    }
    sayHello() {
        // this.args.foo
    }
}
