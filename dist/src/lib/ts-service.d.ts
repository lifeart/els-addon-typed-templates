import * as ts from "typescript";
export declare function componentsForService(service: any, clean?: boolean): any;
declare type MatchResultType = 'helper' | 'service' | 'route' | 'controller' | 'modifier' | 'template' | 'component' | 'model' | 'transform' | 'adapter' | 'serializer';
interface MatchResult {
    type: MatchResultType;
    name: string;
    className?: string;
}
export declare function registerProject(item: any): void;
export declare function normalizeToAngleBracketName(name: any): any;
export declare function typeForPath(root: string, uri: string): MatchResult | null;
export declare function serviceForRoot(uri: any): ts.LanguageService;
export {};
//# sourceMappingURL=ts-service.d.ts.map