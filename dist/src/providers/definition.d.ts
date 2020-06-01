import { Project, DefinitionFunctionParams } from '../interfaces';
import VirtualDocumentProvider from './virtual-document';
export default class DefinitionProvider {
    private project;
    private virtualDocument;
    constructor(project: Project, virtualDocument: VirtualDocumentProvider);
    onDefinition({ results, focusPath, type, textDocument }: DefinitionFunctionParams): Promise<any>;
}
//# sourceMappingURL=definition.d.ts.map