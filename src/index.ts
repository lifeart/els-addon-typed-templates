import { registerProject } from './lib/ts-service';
import { Project, Server, DefinitionFunctionParams, CompletionFunctionParams } from './interfaces';
import { setupLinter } from './linter';
import DefinitionProvider from './providers/definition';
import CompletionProvider from './providers/completion';

module.exports = class TypedTemplates {
  server!: Server;
  project!: Project;
  definitionProvider!: DefinitionProvider;
  completionProvider!: CompletionProvider;
  onInit(server, project) {
    this.server = server;
    this.project = project;
    registerProject(project, server);
    setupLinter(project.root, project, server);
    this.definitionProvider = new DefinitionProvider(project);
    this.completionProvider = new CompletionProvider(project);
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