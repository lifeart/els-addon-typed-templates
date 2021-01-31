import { Project, Server } from '@lifeart/ember-language-server';
import { ASTv1 } from "@glimmer/syntax";
declare class TypescriptTemplate {
    private builder;
    private project;
    yields: string[];
    imports: string[];
    fileName: string;
    depth: number;
    componentsMap: {};
    globalRegistry: {};
    parents: any;
    scopes: any;
    klass: {};
    builtinImports: string[];
    globalScope: {};
    tailForGlobalScope: {};
    pathsForGlobalScope: {};
    definedScope: {};
    componentImport: {};
    comments: any[];
    meta: any;
    componentsForImport: any[];
    blockPaths: any[];
    constructor(builder: TypescriptTemplateBuilder, project: Project, { componentsMap, fileName, globalRegistry, depth, parents, scopes, klass, globalScope, tailForGlobalScope, pathsForGlobalScope, definedScope, componentImport, comments, meta, componentsForImport, blockPaths }: {
        componentsMap: any;
        fileName: any;
        globalRegistry: any;
        depth: any;
        parents: any;
        scopes: any;
        klass: any;
        globalScope: any;
        tailForGlobalScope: any;
        pathsForGlobalScope: any;
        definedScope: any;
        componentImport: any;
        comments: any;
        meta: any;
        componentsForImport: any;
        blockPaths: any;
    });
    getPathScopes(node: ASTv1.PathExpression, key: any): {
        scopeKey: string | undefined;
        scopeChain: string[];
        foundKey: string | any[];
    };
    getItemScopes(key: any, itemScopes?: any): any;
    addImport(name: any, filePath: any): void;
    process(): void;
    addComponentImport(name: any, filePath: any): void;
}
export declare class TypescriptTemplateBuilder {
    private server;
    private project;
    constructor(server: Server, project: Project);
    registerTemplateKlassForFile(componentsMap: any, registry: any, virtualFileName: any, templateFileName: any, scriptFileName: any, depth: number, projectRoot: string): void;
    emptyTemplate(meta: any): string;
    unknownTemplate(): string;
    getClass(componentsMap: any, fileName: any, { nodes, comments, meta }: {
        nodes: any;
        comments: any;
        meta: any;
    }, componentImport: string | null, globalRegistry: any, depth?: number): string;
    hasNoCheck(comments: any): any;
    hasArgsTypings(comments: any): any;
    isTemplateOnlyComponent(componentImport: any): boolean;
    componentKlassImport(componentImport: any): string;
    templateComponentDeclaration(componentImport: any, meta: any): string;
    componentExtraProperties(componentImport: any, hasArgsTypings: any): string;
    builtinImportsTemplate(builtinImports: any): string;
    templateScopeRegistryTemplate(globalScope: any, definedScope: any): string;
    templateImportsTemplate(imports: any): string;
    noCheckTemplate(hasNocheck: any): "" | "// @ts-nocheck";
    defaultYieldBodyTemplate(yields: any): string;
    klassFieldsTemplate(klass: any, comments: any): string;
    maybeArgTypingsTemplate(hasArgsTypings: any): any;
    templateOnlyComponentConstructorTemplate(isTemplateOnlyComponent: any, hasArgsTypings: any): string;
    makeClass({ meta, builtinImports, imports, yields, klass, comments, componentImport, globalScope, definedScope }: TypescriptTemplate): string;
}
export {};
//# sourceMappingURL=hbs-converter.d.ts.map