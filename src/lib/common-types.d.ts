declare module '@glimmer/component' {

    export default class Component<Args extends {} = {}> extends BaseComponent<Args> {
        args: Args;
        willDestroy: () => void;
        toString: () => string;
    }
}

declare module '@ember/component' {
    export function setComponentTemplate<T,U>(Template: T, Klass: U): U;

    export default class Component<Args extends {} = {}> extends BaseComponent<Args> {
        args: Args;
        willDestroy: () => void;
        toString: () => string;
    }
}

declare module "@ember/component/helper" {
    export function helper<T>(Helper: T): T;
}
declare module "@ember/modifier" {
    export function setModifierManager<T,U>(Manager: T,Modifier: U): U;
}

