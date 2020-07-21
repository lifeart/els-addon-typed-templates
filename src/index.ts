import { registerProject } from './lib/ts-service';
import { Project, Server, DefinitionFunctionParams, CompletionFunctionParams } from './interfaces';
import { setupLinter } from './providers/linter';
import DefinitionProvider from './providers/definition';
import CompletionProvider from './providers/completion';
import Linter from './providers/linter';
import { AddonAPI } from './interfaces';
import VirtualDocumentProvider from './providers/virtual-document';

module.exports = class TypedTemplates implements AddonAPI {
  server!: Server;
  project!: Project;
  definitionProvider!: DefinitionProvider;
  completionProvider!: CompletionProvider;
  virtualDocumentProvider!: VirtualDocumentProvider;
  linter!: Linter;
  constructor() {
    // temporary context fix for UELS
    this.onInit = this.onInit.bind(this);
    this.onComplete = this.onComplete.bind(this);
    this.onDefinition = this.onDefinition.bind(this);
  }
  onInit(server, project) {
    this.server = server;
    this.project = project;
    this.virtualDocumentProvider = new VirtualDocumentProvider(server, project);
    this.definitionProvider = new DefinitionProvider(project, this.virtualDocumentProvider);
    this.completionProvider = new CompletionProvider(project, this.virtualDocumentProvider);
    registerProject(project, server);
    this.linter = setupLinter(project, this.virtualDocumentProvider);
  }
  async onComplete(
    _: string, params: CompletionFunctionParams
  ) {
    return this.completionProvider.onComplete(params);
  }
  async onDefinition(_: string, params: DefinitionFunctionParams) {
    return this.definitionProvider.onDefinition(params);
  }
}