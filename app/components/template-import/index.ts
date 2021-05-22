import Component from '@glimmer/component';
import PossibleUndefined from './../possible-undefined/component';

export default class MyComponent extends Component {
    hello = PossibleUndefined;
}