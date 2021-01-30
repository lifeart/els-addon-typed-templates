import { CompletionFunctionParams } from '../interfaces';
import { Project } from '@lifeart/ember-language-server';
import { CompletionItem } from 'vscode-languageserver';
import VirtualDocumentProvider from './virtual-document';
export default class CompletionProvider {
    private project;
    private virtualDocument;
    constructor(project: Project, virtualDocument: VirtualDocumentProvider);
    onComplete({ results, focusPath, type, textDocument }: CompletionFunctionParams): Promise<CompletionItem[] | null>;
}
//# sourceMappingURL=completion.d.ts.map