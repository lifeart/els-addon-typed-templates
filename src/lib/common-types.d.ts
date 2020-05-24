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
}
declare module "@ember/modifier" {
  export function setModifierManager<T, U>(Manager: T, Modifier: U): U;
}

declare module "ember-typed-templates" {
  type YieldHelper = <A, B, C, D, E>(
    items?: [A, B?, C?, D?, E?],
    hash?
  ) => [A, B, C, D, E];
  type EachHelper = <T extends any>([items]: ArrayLike<T>[], hash?) => [T, number];
  type LetHelper = <A, B, C, D, E>(
    items: [A, B?, C?, D?, E?],
    hash?
  ) => [A, B, C, D, E];
  type AbstractHelper = <T>([items]: T[], hash?) => T;
  export type AbstractBlockHelper = <T>([items]: ArrayLike<T>[], hash?) => [T];
  type HashHelper = <T>(items: any[], hash: T) => T;
  type ArrayHelper = <T>(items: ArrayLike<T>, hash?) => ArrayLike<T>;
  type AnyFn = (...args) => any;
  type OnModifer = ([event, handler]: [string, Function], hash?) => void;
  type FnHelper = AnyFn;
  type ConcatHelper = (...args: any[]) => string;
  type AndHelper = <A, B, C, D, E>(items: [A, B, C?, D?, E?]) => boolean;
  type EventCatcherHelper = <A, B, C, D, E>(
    items?: [A?, B?, C?, D?, E?]
  ) => AnyFn;

  function TIfHeper<T, U, Y>([a, b, c]: [T, U?, Y?], hash?) {
    return !!a ? b : c;
  }
  function TUnlessHeper<T, U, Y>([a, b, c]: [T, U?, Y?], hash?) {
    return !TIfHeper(a,b,c, hash);
  }
  export interface GlobalRegistry {
    ["each"]: EachHelper;
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
    ["stop-propagation"]: EventCatcherHelper;
    ["lazy-mount"]: (params?, hash?) => [{ isLoading: boolean; error: any }];
    ["v-get"]: ([ctx, prop, propTwo]: [any, any, any?], hash?) => any;
    ["and"]: AndHelper;
  }
}
