import { Project } from '@lifeart/ember-language-server';
import { Diagnostic } from 'vscode-languageserver';
import VirtualDocumentProvider from './virtual-document';
import { TextDocument } from 'vscode-languageserver-textdocument';
export declare function setupLinter(project: Project, virtualDocument: VirtualDocumentProvider): Linter;
export default class Linter {
    private project;
    private virtualDocument;
    constructor(project: Project, virtualDocument: VirtualDocumentProvider);
    canLint(templatePath: string): boolean;
    lintFile(textDocument: TextDocument): Promise<Diagnostic[] | undefined>;
}
//# sourceMappingURL=linter.d.ts.map