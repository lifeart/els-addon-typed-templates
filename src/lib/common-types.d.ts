declare module "@glimmer/component" {
  export default class Component<Args extends {} = {}> extends BaseComponent<
    Args
  > {
    args: Args;
    willDestroy: () => void;
    toString: () => string;
  }
}

declare module "@ember/component" {
  export function setComponentTemplate<T, U>(Template: T, Klass: U): U;

  export default class Component<Args extends {} = {}> extends BaseComponent<
    Args
  > {
    args: Args;
    willDestroy: () => void;
    toString: () => string;
  }
}

declare module "@ember/component/helper" {
  export function helper<T>(Helper: T): T;
}
declare module "@ember/modifier" {
  export function setModifierManager<T, U>(Manager: T, Modifier: U): U;
}

declare module "ember-typed-templates" {
  type YieldHelper = <A, B, C, D, E>(
    items: [A, B, C, D, E],
    hash?
  ) => [A, B, C, D, E];
  type EachHelper = <T>([items]: ArrayLike<T>[], hash?) => [T, number];
  type LetHelper = <A, B, C, D, E>(
    items: [A, B, C, D, E],
    hash?
  ) => [A, B, C, D, E];
  type AbstractHelper = <T>([items]: T[], hash?) => T;
  type AbstractBlockHelper = <T>([items]: ArrayLike<T>[], hash?) => [T];
  type HashHelper = <T>(items: any[], hash: T) => T;
  type ArrayHelper = <T>(items: ArrayLike<T>, hash?) => ArrayLike<T>;
  type AnyFn = (...args) => any;
  type OnModifer = ([event, handler]: [string, Function], hash?) => void;
  type FnHelper = AnyFn;
  type ConcatHelper = (...args: (number | string)[]) => string;
  type AndHelper = <A, B, C, D, E>(items: [A, B, C?, D?, E?]) => boolean;
  type EventCatcherHelper = <A, B, C, D, E>(
    items?: [A?, B?, C?, D?, E?]
  ) => AnyFn;

  function TIfHeper<T, U, Y>([a, b, c]: [T, U?, Y?], hash?) {
    return !!a ? b : c;
  }
  export interface GlobalRegistry {
    ["each"]: EachHelper;
    ["let"]: LetHelper;
    ["hash"]: HashHelper;
    ["array"]: ArrayHelper;
    ["if"]: typeof TIfHeper;
    ["on"]: OnModifer;
    ["fn"]: FnHelper;
    ["yield"]: YieldHelper;
    ["concat"]: ConcatHelper;
    ["prevent-default"]: EventCatcherHelper;
    ["stop-propagation"]: EventCatcherHelper;
    ["lazy-mount"]: (params?, hash?) => [{ isLoading: boolean; error: any }];
    ["v-get"]: ([ctx, prop]: [Object, string], hash?) => any;
    ["and"]: AndHelper;
  }
}
