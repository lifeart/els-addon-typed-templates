import { Location, Range, Diagnostic } from "vscode-languageserver";
export declare function normalizeDefinitions(results: any): any;
export declare function normalizeCompletions(tsResults: any, realPath: any, isArg: any): any;
export declare function offsetToRange(start: any, limit: any, source: any): Range;
export declare function tsDefinitionToLocation(el: any): Location;
export declare function getFullSemanticDiagnostics(server: any, service: any, fileName: any, uri: any): void;
export declare function getSemanticDiagnostics(server: any, service: any, templateRange: any, fileName: any, focusPath: any, uri: any): void;
export declare function toDiagnostic(err: any, [startIndex, endIndex]: [any, any], focusPath: any): Diagnostic;
//# sourceMappingURL=ls-utils.d.ts.map