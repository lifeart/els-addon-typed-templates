import { TextDocuments, Location, TextDocumentIdentifier, Position, CompletionItem } from 'vscode-languageserver';
import { LSRegistry } from './lib/ts-service';
import { Project } from '@lifeart/ember-language-server';

interface Registry extends LSRegistry {
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