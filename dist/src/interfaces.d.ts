import { TextDocuments, Location, TextDocumentIdentifier, Position, CompletionItem } from 'vscode-languageserver';
import { LSRegistry } from './lib/ts-service';
import { Project } from '@lifeart/ember-language-server';
interface Registry extends LSRegistry {
    component: {
        [componentName: string]: string[];
    };
    service: {
        [serviceName: string]: string[];
    };
    routePath: {
        [routePath: string]: string[];
    };
}
interface Command {
    command: string;
    arguments: any[];
}
export interface Server {
    getRegistry(projectRoot: string): Registry;
    onExecute(command: Command): any;
    getUsages(normalizedName: string): string[];
    documents: TextDocuments<any>;
}
interface BaseAPIParams {
    server: Server;
    textDocument: TextDocumentIdentifier;
    position: Position;
}
interface ExtendedAPIParams extends BaseAPIParams {
    focusPath: any;
    type: 'script' | 'template';
}
interface ReferenceFunctionParams extends BaseAPIParams {
    results: Location[];
}
export interface CompletionFunctionParams extends ExtendedAPIParams {
    results: CompletionItem[];
}
export interface DefinitionFunctionParams extends ExtendedAPIParams {
    results: Location[];
}
declare type ReferenceResolveFunction = (root: string, params: ReferenceFunctionParams) => Promise<Location[]>;
declare type CompletionResolveFunction = (root: string, params: CompletionFunctionParams) => Promise<CompletionItem[] | null>;
declare type DefinitionResolveFunction = (root: string, params: DefinitionFunctionParams) => Promise<Location[]>;
declare type InitCallback = (server: Server, project: Project) => void;
export interface AddonAPI {
    onReference?: undefined | ReferenceResolveFunction;
    onComplete: undefined | CompletionResolveFunction;
    onDefinition: undefined | DefinitionResolveFunction;
    onInit: undefined | InitCallback;
}
export {};
//# sourceMappingURL=interfaces.d.ts.map