import { Project } from '../interfaces';
import { Diagnostic } from 'vscode-languageserver';
import VirtualDocumentProvider from './virtual-document';
export declare function setupLinter(project: Project, virtualDocument: VirtualDocumentProvider): Linter;
export default class Linter {
    private project;
    private virtualDocument;
    constructor(project: Project, virtualDocument: VirtualDocumentProvider);
    canLint(templatePath: string): boolean;
    lintFile(textDocument: any): Promise<Diagnostic[] | undefined>;
}
//# sourceMappingURL=linter.d.ts.map