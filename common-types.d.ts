declare module '@glimmer/component' {
	export default class Component {
        willDestroy: () => void
    }
}

type helperFn = ([...any], any) => any
