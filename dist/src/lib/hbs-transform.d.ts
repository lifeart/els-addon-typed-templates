export declare function keyForItem(item: any): string;
export declare function positionForItem(item: any): string;
export declare function transformPathExpression(node: any, key: any, { getItemScopes, tailForGlobalScope, pathsForGlobalScope, importNameForItem, componentImport, declaredInScope, addImport, addComponentImport, getPathScopes, yields, componentsForImport, globalScope, blockPaths, globalRegistry }: {
    getItemScopes: any;
    tailForGlobalScope: any;
    pathsForGlobalScope: any;
    importNameForItem: any;
    componentImport: any;
    declaredInScope: any;
    addImport: any;
    addComponentImport: any;
    getPathScopes: any;
    yields: any;
    componentsForImport: any;
    globalScope: any;
    blockPaths: any;
    globalRegistry: any;
}): {
    result: string;
    simpleResult: string;
    builtinScopeImports: unknown[];
};
export declare const transform: {
    klass: {};
    support(node: any): boolean;
    transform(node: any, key: string, klass?: any): string;
    wrapToFunction(str: string, key: string): string;
    addMark(key: string): string;
    _wrap(str: string, key: string, returnType?: "" | undefined): string;
    fn(args: string, body: string, key: string): string;
    _makeFn(rawArgs: string, rawBody: string, key: string): string;
    TextNode(node: any): string;
    TypeForTextNode(node: any): string;
    pathCall(node: any): any;
    hashedExp(node: any, nodeType?: string): string;
    SubExpression(node: any): string;
    MustacheStatement(node: any): string;
    ElementModifierStatement(node: any): string;
    BlockStatement(node: any): string;
    NumberLiteral(node: any): string;
    TypeForNumberLiteral(node: any): string;
    StringLiteral(node: any): string;
    TypeForStringLiteral(node: any): string;
    TypeForNullLiteral(): string;
    NullLiteral(): string;
    BooleanLiteral(node: any): string;
    UndefinedLiteral(): string;
};
//# sourceMappingURL=hbs-transform.d.ts.map