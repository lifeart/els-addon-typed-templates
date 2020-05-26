import { MatchResult } from './ts-service';
export declare function createFullVirtualTemplate(projectRoot: any, componentsMap: any, templatePath: any, fileName: any, server: any, uri: any, content: string | boolean | undefined, meta: MatchResult): any;
export declare function createVirtualTemplate(projectRoot: any, componentsMap: any, fileName: any, { templatePath, realPath, isArg, isArrayCase, isParam }: any): {
    pos: any;
    posStart: number;
};
export declare function getBasicComponent(pathExp?: string, flags?: any): string;
//# sourceMappingURL=virtual-documents.d.ts.map