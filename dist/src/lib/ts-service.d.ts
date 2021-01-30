import * as ts from "typescript";
import { Project } from '@lifeart/ember-language-server';
export declare function componentsForService(service: any, clean?: boolean): any;
declare type ProjectFile = {
    version: number;
};
declare type TSMeta = {
    version: number;
    snapshot: ts.IScriptSnapshot;
};
declare type MatchResultType = 'helper' | 'service' | 'route' | 'controller' | 'modifier' | 'template' | 'component' | 'model' | 'transform' | 'adapter' | 'serializer';
export interface MatchResult {
    type: MatchResultType;
    name: string;
    kind: string;
    scope: string;
    className?: string;
}
interface RegistryItem {
    [key: string]: string[];
}
export interface LSRegistry {
    'transform': RegistryItem;
    'helper': RegistryItem;
    'component': RegistryItem;
    'routePath': RegistryItem;
    'model': RegistryItem;
    'service': RegistryItem;
    'modifier': RegistryItem;
}
export interface LanguageServer {
    getRegistry(root: string): LSRegistry;
}
interface ProjectMirror {
    project: {
        files: Map<string, ProjectFile>;
        matchPathToType(filePath: string): null | MatchResult;
    };
    server: LanguageServer;
    files: WeakMap<ProjectFile, TSMeta>;
}
export declare function registerProject(item: any, server: any): void;
export declare function serverForProject(root: string): LanguageServer;
export declare function matchPathToType(project: Project, uri: string): MatchResult | null;
export declare function typeForPath(root: string, uri: string): MatchResult | null;
export default class TypescriptService implements ts.LanguageServiceHost {
    ts: ts.LanguageService;
    registry: ts.DocumentRegistry;
    tsConfig: {};
    projectRoot: string;
    project: ProjectMirror;
    initialFiles: any;
    constructor(projectRoot: string);
    private getProjectFilesFromFolder;
    private initialProjectFileStructure;
    getDefaultLibFileName(opts: ts.CompilerOptions): string;
    getCompilationSettings(): {
        baseUrl: string;
        allowJs: boolean;
        checkJs: boolean;
        allowSyntheticDefaultImports: boolean;
        skipLibCheck: boolean;
        experimentalDecorators: boolean;
        noImplicitAny: boolean;
        moduleResolution: ts.ModuleResolutionKind;
        strictPropertyInitialization: boolean;
        module: ts.ModuleKind;
    };
    getScriptFileNames(): any[];
    getScriptVersion(fileName: string): string;
    getScriptSnapshot(rawFileName: any): ts.IScriptSnapshot | undefined;
    getCurrentDirectory(): string;
}
export declare function serviceForRoot(uri: any): ts.LanguageService;
export {};
//# sourceMappingURL=ts-service.d.ts.map