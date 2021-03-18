declare module "@glimmer/component" {
  type UnknownConfig = Record<string, unknown>;

  export default class Component<Args extends UnknownConfig = {}> extends BaseComponent<
    Args
  > {
    constructor(owner: unknown, args: Args) {
      super(...arguments);
      this.args = args;
    }
    args: Args;
    willDestroy: () => void;
    toString: () => string;
  }
}

declare module "@ember/component" {
  type UnknownConfig = Record<string, unknown>;
  export function setComponentTemplate<T, U>(Template: T, Klass: U): U;


  export default class Component<Args extends UnknownConfig = { }> extends BaseComponent<
    Args
  > {
    constructor(owner: unknown, args: Args = {  }) {
      super(...arguments);
      this.args = args;
    }
    static extend(args) {
      return class ExtendedComponent extends Component<typeof args> {
 
      }
    }
    args: Args;
    willDestroy: () => void;
    toString: () => string;
  }
}


declare module "@ember/component/helper" {
  export function helper<T>(Helper: T): T;
  export default class Helper extends Function {

  };
}
declare module "@ember/modifier" {
  export function setModifierManager<T, U>(Manager: T, Modifier: U): U;
}

declare module "ember-modifier" {
  export function modifier<T>(Modifier: T): T;
  export default class Modifier extends Function {

  };
}



declare module "ember-typed-templates" {
  type PropType<TObj, TProp extends keyof TObj> = TObj[TProp];
  type Unpromisify<T> = T extends PromiseLike<infer R> ? R : T;
  type YieldHelper = <A, B, C, D, E>(
    items?: [A, B?, C?, D?, E?],
    hash?
  ) => [A, B, C, D, E];
  type EachHelper = <T extends any>([items]: ArrayLike<T>[], hash?) => [T, number];
  type EachInHelper = <T extends object, A extends keyof T>([items]: [T]) => [A,PropType<T, A>];
  type LetHelper = <A, B, C, D, E>(
    items: [A, B?, C?, D?, E?],
    hash?
  ) => [A, B, C, D, E];
  type AbstractHelper = <T>([items]: T[], hash?) => T;
  export type AbstractBlockHelper = <T>([items]: ArrayLike<T>[], hash?) => [T];
  type HashHelper = <T>(items: any[], hash: T) => T;
  type ArrayHelper = <T>(items?: ArrayLike<T>, hash?) => ArrayLike<T>;
  type AnyFn = (...args) => any;
  type OnModifer = ([event, handler]: [string, Function], hash?) => void;
  type FnHelper = AnyFn;
  type ConcatHelper = (...args: any[]) => string;
  type AndHelper = <A, B, C, D, E>(items: [A, B, C?, D?, E?]) => boolean;
  type EventCatcherHelper = <A, B, C, D, E>(
    items?: [A?, B?, C?, D?, E?]
  ) => AnyFn;
  // ember-async-await-helper
  type AsyncAwaitHelper = <T>(
    params: [T],
    hash?: { onReject: ((reason: any) => void) | null }
  ) => [Unpromisify<T>]

  function TIfHeper<T, U, Y>([a, b, c]: [T, U?, Y?], hash?) {
    return !!a ? b : c;
  }
  function TUnlessHeper<T, U, Y>([a, b, c]: [T, U?, Y?], hash?) {
    return !TIfHeper(a,b,c, hash);
  }

  export interface GlobalRegistry {
    ["each"]: EachHelper;
    ["each-in"]: EachInHelper;
    ["let"]: LetHelper;
    ["hash"]: HashHelper;
    ["array"]: ArrayHelper;
    ["if"]: typeof TIfHeper;
    ["unless"]: typeof TUnlessHeper;
    ["on"]: OnModifer;
    ["fn"]: FnHelper;
    ["has-block"]: YieldHelper;
    ["yield"]: YieldHelper;
    ["outlet"]: YieldHelper;
    ["concat"]: ConcatHelper;
    ["prevent-default"]: EventCatcherHelper;
    ["toggle"]: <T>(props: [keyof T, T]) => Function;
    ["includes"]: <T>(props: [T, T[]]) => boolean;
    ["chunk"]: <T>(props: [T[], number]) => Array<T[]>;
    ["sort-by"]: <T>(props: [...string, T]) => T;
    ["filter-by"]: <T, K extends keyof T, B extends PropType<T, K>>(props: [K, B, T[]]) => T[];
    ["drop"]: <T>(props: [number, T[]]) => T[];
    ["take"]: <T>(props: [number, T[]]) => T[];
    ["get"]: <T, K extends keyof T>(props: [K, T]) => T[K];
    ["eq"]: (props: [any, any]) => boolean;
    ["gt"]: (props: [number, number]) => boolean;
    ["gte"]: (props: [number, number]) => boolean;
    ["lt"]: (props: [number, number]) => boolean;
    ["lte"]: (props: [number, number]) => boolean;
    ["optional"]: (props: [ Function | undefined | void | false ]) => Function;
    ["stop-propagation"]: EventCatcherHelper;
    ["lazy-mount"]: (params?, hash?) => [{ isLoading: boolean; error: any }];
    ["v-get"]: ([ctx, prop, propTwo]: [any, any, any?], hash?) => any;
    ["did-insert"]: (params: [ Function, ...any], hash?: any) => void;
    ["did-update"]: (params: [ Function, ...any], hash?: any) => void;
    ["will-destroy"]: (params: [ Function, ...any], hash?: any) => void;
    ["and"]: AndHelper;
    ["async-await"]: AsyncAwaitHelper;
  }
}
