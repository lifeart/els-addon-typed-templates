import * as ts from "typescript";
import { Location, Range, Diagnostic } from "vscode-languageserver";
export declare function normalizeDefinitions(results: any, root: string): any;
export declare function normalizeCompletions(tsResults: any, realPath: any, isArg: any): any;
export declare function offsetToRange(start: any, limit: any, source: any): Range;
export declare function tsDefinitionToLocation(el: any, root: any): Location | null;
export declare function getFullSemanticDiagnostics(service: ts.LanguageService, fileName: any): Diagnostic[];
export declare function getSemanticDiagnostics(server: any, service: any, templateRange: any, fileName: any, focusPath: any, uri: any): void;
export declare function toDiagnostic(err: any, [startIndex, endIndex]: [any, any], focusPath: any): Diagnostic;
//# sourceMappingURL=ls-utils.d.ts.map