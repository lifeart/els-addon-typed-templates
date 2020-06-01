import { registerProject } from './lib/ts-service';
import { Project, Server, DefinitionFunctionParams, CompletionFunctionParams } from './interfaces';
import { setupLinter } from './providers/linter';
import DefinitionProvider from './providers/definition';
import CompletionProvider from './providers/completion';
import Linter from './providers/linter';
import { AddonAPI } from './interfaces';

module.exports = class TypedTemplates implements AddonAPI {
  server!: Server;
  project!: Project;
  definitionProvider!: DefinitionProvider;
  completionProvider!: CompletionProvider;
  linter!: Linter;
  onInit(server, project) {
    this.server = server;
    this.project = project;
    this.definitionProvider = new DefinitionProvider(project);
    this.completionProvider = new CompletionProvider(project);
    registerProject(project, server);
    this.linter = setupLinter(project, server);
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