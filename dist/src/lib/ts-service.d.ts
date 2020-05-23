import * as ts from "typescript";
export declare function componentsForService(service: any, clean?: boolean): any;
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
export declare function registerProject(item: any, server: any): void;
export declare function normalizeToAngleBracketName(name: any): any;
export declare function serverForProject(root: string): {
    getRegistry(root: string): {
        'transform': RegistryItem;
        'helper': RegistryItem;
        'component': RegistryItem;
        'routePath': RegistryItem;
        'model': RegistryItem;
        'service': RegistryItem;
        'modifier': RegistryItem;
    };
};
export declare function typeForPath(root: string, uri: string): MatchResult | null;
export declare function serviceForRoot(uri: any): ts.LanguageService;
export {};
//# sourceMappingURL=ts-service.d.ts.map