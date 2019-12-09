declare module '@glimmer/component' {
	export default class Component {
        willDestroy: () => void
    }
}

declare module "@ember/component/helper" {
    export function helper<T>(T): T;
}
declare module "@ember/modifier" {
    export function setModifierManager<T,U>(T,U): U;
}
declare module "@ember/component" {
    export function setComponentTemplate<T,U>(T,U): U;
}