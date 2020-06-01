import { FileChangeType, Diagnostic, TextDocument, Location, TextDocumentIdentifier, Position, CompletionItem } from 'vscode-languageserver';

type Executor = (server: Server, command: string, args: any[]) => any;
type Linter = (document: TextDocument) => Promise<Diagnostic[] | null>;
type Watcher = (uri: string, change: FileChangeType) => any;

type MatchResultType =
    | 'helper'
    | 'service'
    | 'route'
    | 'controller'
    | 'modifier'
    | 'template'
    | 'component'
    | 'model'
    | 'transform'
    | 'adapter'
    | 'serializer';

interface MatchResult {
    type: MatchResultType;
    name: string;
}

export interface Project {
    root: string; // project entry path
    addCommandExecutor(key: string, fn: Executor): void;
    addLinter(fn: Linter): void;
    addWatcher(fn: Watcher): void;
    matchPathToType(filePath: string): null | MatchResult;
}

interface Registry {
    component: {
        [componentName: string]: string[] // files, related to component
    },
    service: {
        [serviceName: string]: string[] // files, related to service
    },
    routePath: {
        [routePath: string]: string[] // files, related to route (templates, controllers, routes)
    }
}

interface Command {
    command: string // els.executeInEmberCLI
    arguments: any[] // first argument - file path / project root, if command scoped to project
}
export interface Server {
    getRegistry(projectRoot: string): Registry;
    onExecute(command: Command): any;
    getUsages(normalizedName: string): string[]; // return list of files, related to token
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

type ReferenceResolveFunction = (root: string, params: ReferenceFunctionParams) => Promise<Location[]>;
type CompletionResolveFunction = (root: string, params: CompletionFunctionParams) => Promise<CompletionItem[] | null>;
type DefinitionResolveFunction = (root: string, params: DefinitionFunctionParams) => Promise<Location[]>;
type InitCallback = (server: Server, project: Project) => void;


export interface AddonAPI {
    onReference?: undefined | ReferenceResolveFunction;
    onComplete: undefined | CompletionResolveFunction;
    onDefinition: undefined | DefinitionResolveFunction;
    onInit: undefined | InitCallback;
}