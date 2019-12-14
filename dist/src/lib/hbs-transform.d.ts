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
    transform(node: any, key: string): string;
    wrapToFunction(str: string, key: string): string;
    addMark(key: string): string;
    _wrap(str: string, key: string): string;
    fn(args: string, body: string, key: string): string;
    _makeFn(rawArgs: string, rawBody: string, key: string): string;
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