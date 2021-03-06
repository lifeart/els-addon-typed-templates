import { ASTv1 } from '@glimmer/syntax';
export declare function keyForItem(item: any): string;
export declare function positionForItem(item: any): string;
export declare function normalizePathOriginal(node: ASTv1.PathExpression): string;
export declare function transformPathExpression(node: ASTv1.PathExpression, key: any, { getItemScopes, tailForGlobalScope, pathsForGlobalScope, importNameForItem, componentImport, declaredInScope, addImport, addComponentImport, getPathScopes, yields, componentsForImport, globalScope, blockPaths, globalRegistry }: {
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
    transform(node: ASTv1.BaseNode, key: string, klass?: any): string;
    wrapToFunction(str: string, key: string): string;
    addMark(key: string): string;
    _wrap(str: string, key: string, returnType?: string): string;
    fn(args: string, body: string, key: string): string;
    _makeFn(rawArgs: string, rawBody: string, key: string): string;
    TextNode(node: ASTv1.TextNode): string;
    TypeForTextNode(node: ASTv1.TextNode): string;
    pathCall(node: any): any;
    hashedExp(node: ASTv1.BlockStatement | ASTv1.MustacheStatement | ASTv1.ElementModifierStatement | ASTv1.SubExpression, nodeType?: string): string;
    SubExpression(node: ASTv1.SubExpression): string;
    ConcatStatement(node: ASTv1.ConcatStatement): string;
    TypeForConcatStatement(): string;
    MustacheStatement(node: ASTv1.MustacheStatement): string;
    ElementModifierStatement(node: ASTv1.ElementModifierStatement): string;
    BlockStatement(node: ASTv1.BlockStatement): string;
    NumberLiteral(node: ASTv1.NumberLiteral): string;
    TypeForNumberLiteral(node: any): string;
    StringLiteral(node: ASTv1.StringLiteral): string;
    TypeForStringLiteral(node: any): string;
    TypeForNullLiteral(): string;
    TypeForUndefinedLiteral(): string;
    TypeForBooleanLiteral(): string;
    NullLiteral(): string;
    BooleanLiteral(node: ASTv1.BooleanLiteral): string;
    UndefinedLiteral(): string;
};
//# sourceMappingURL=hbs-transform.d.ts.map