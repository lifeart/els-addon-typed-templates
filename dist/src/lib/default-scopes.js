"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function defaultScopes() {
    const definedScope = {
        ["each"]: "EachHelper",
        ["let"]: "LetHelper",
        ["hash"]: "HashHelper",
        ["array"]: "ArrayHelper",
        ["if"]: "typeof TIfHeper",
        ["on"]: "OnModifer",
        ["fn"]: "FnHelper",
        ["yield"]: "YieldHelper",
        ["has-block"]: "YieldHelper",
        ["outlet"]: "YieldHelper",
        ["concat"]: "ConcatHelper",
        ["prevent-default"]: "EventCatcherHelper",
        ["stop-propagation"]: "EventCatcherHelper",
        ["lazy-mount"]: "(params?, hash?)=>[{isLoading: boolean, error: any}]",
        ["v-get"]: "([ctx, prop]: [Object, string], hash?) => any",
        ["and"]: "AndHelper"
    };
    const globalScope = Object.assign({}, definedScope);
    const pathsForGlobalScope = {
        each: "<T>(params: ArrayLike<T>[], hash?)",
        let: "<A,B,C,D,E>(params: [A,B?,C?,D?,E?], hash?)",
        and: "<A,B,C,D,E>(params: [A,B,C?,D?,E?])",
        'stop-propagation': "<A,B,C,D,E>(params?: [A?,B?,C?,D?,E?])",
        'prevent-default': "<A,B,C,D,E>(params?: [A?,B?,C?,D?,E?])",
        array: "<T>(params: ArrayLike<T>, hash?)",
        hash: "<T>(params = [], hash: T)",
        if: "<T,U,Y>([a,b,c]:[T?,U?,Y?], hash?)",
        fn: "(params: any[])",
        on: "([eventName, handler]: [string, Function], hash?)",
        yield: "<A,B,C,D,E>(params?: [A?,B?,C?,D?,E?], hash?)"
    };
    const tailForGlobalScope = {
        if: "([a as T,b as U,c as Y], hash)",
        let: "(params as [A,B,C,D,E], hash)",
        and: "(params as [A,B,C,D,E])",
        'prevent-default': "(params as [A,B,C,D,E])",
        'stop-propagation': "(params as [A,B,C,D,E])",
        yield: "(params as [A,B,C,D,E], hash)",
        fn: "(params)",
        on: "([eventName, handler], hash)"
    };
    return {
        globalScope, pathsForGlobalScope, tailForGlobalScope, definedScope
    };
}
exports.defaultScopes = defaultScopes;
//# sourceMappingURL=default-scopes.js.map