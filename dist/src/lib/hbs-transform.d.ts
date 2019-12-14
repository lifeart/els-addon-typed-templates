export declare function keyForItem(item: any): string;
export declare function positionForItem(item: any): string;
export declare function transformPathExpression(node: any, key: any, { getItemScopes, tailForGlobalScope, pathsForGlobalScope, importNameForItem, componentImport, addImport, addComponentImport, getPathScopes, yields, componentsForImport, globalScope, blockPaths, globalRegistry }: {
    getItemScopes: any;
    tailForGlobalScope: any;
    pathsForGlobalScope: any;
    importNameForItem: any;
    componentImport: any;
    addImport: any;
    addComponentImport: any;
    getPathScopes: any;
    yields: any;
    componentsForImport: any;
    globalScope: any;
    blockPaths: any;
    globalRegistry: any;
}): string;
export declare const transform: {
    support(node: any): boolean;
    transform(node: any, key: any): string;
    wrapToFunction(str: any, key: any): string;
    addMark(key: any): string;
    _wrap(str: any, key: any): string;
    fn(args: any, body: any, key: any): string;
    _makeFn(rawArgs: any, rawBody: any, key: any): string;
    TextNode(node: any): string;
    hashedExp(node: any): string;
    SubExpression(node: any): string;
    MustacheStatement(node: any): string;
    ElementModifierStatement(node: any): string;
    BlockStatement(node: any): string;
    NumberLiteral(node: any): string;
    StringLiteral(node: any): string;
    NullLiteral(): string;
    BooleanLiteral(node: any): string;
    UndefinedLiteral(): string;
};
//# sourceMappingURL=hbs-transform.d.ts.map