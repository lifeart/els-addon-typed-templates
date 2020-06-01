import { Project, CompletionFunctionParams } from '../interfaces';
import { CompletionItem } from 'vscode-languageserver';
import VirtualDocumentProvider from './virtual-document';
export default class CompletionProvider {
    private project;
    private virtualDocument;
    constructor(project: Project, virtualDocument: VirtualDocumentProvider);
    onComplete({ results, focusPath, type, textDocument }: CompletionFunctionParams): Promise<CompletionItem[] | null>;
}
//# sourceMappingURL=completion.d.ts.map