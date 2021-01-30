import { DefinitionFunctionParams } from '../interfaces';
import { Project } from '@lifeart/ember-language-server';
import VirtualDocumentProvider from './virtual-document';
export default class DefinitionProvider {
    private project;
    private virtualDocument;
    constructor(project: Project, virtualDocument: VirtualDocumentProvider);
    onDefinition({ results, focusPath, type, textDocument }: DefinitionFunctionParams): Promise<any>;
}
//# sourceMappingURL=definition.d.ts.map