import { FileChangeType, Diagnostic, TextDocument, Location, TextDocumentIdentifier, Position, CompletionItem } from 'vscode-languageserver';
declare type Executor = (server: Server, command: string, args: any[]) => any;
declare type Linter = (document: TextDocument) => Promise<Diagnostic[] | null>;
declare type Watcher = (uri: string, change: FileChangeType) => any;
declare type MatchResultType = 'helper' | 'service' | 'route' | 'controller' | 'modifier' | 'template' | 'component' | 'model' | 'transform' | 'adapter' | 'serializer';
interface MatchResult {
    type: MatchResultType;
    name: string;
}
export interface Project {
    root: string;
    addCommandExecutor(key: string, fn: Executor): void;
    addLinter(fn: Linter): void;
    addWatcher(fn: Watcher): void;
    matchPathToType(filePath: string): null | MatchResult;
}
interface Registry {
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
declare type CompletionResolveFunction = (root: string, params: CompletionFunctionParams) => Promise<CompletionItem[]>;
declare type DefinitionResolveFunction = (root: string, params: DefinitionFunctionParams) => Promise<Location[]>;
declare type InitCallback = (server: Server, project: Project) => void;
export interface AddonAPI {
    onReference: undefined | ReferenceResolveFunction;
    onComplete: undefined | CompletionResolveFunction;
    onDefinition: undefined | DefinitionResolveFunction;
    onInit: undefined | InitCallback;
}
export {};
//# sourceMappingURL=interfaces.d.ts.map