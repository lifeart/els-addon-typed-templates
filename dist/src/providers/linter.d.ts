import { Project, Server } from '../interfaces';
import { Diagnostic } from 'vscode-languageserver';
export declare function setupLinter(project: Project, server: Server): Linter;
export default class Linter {
    private server;
    private project;
    constructor(server: Server, project: Project);
    canLint(templatePath: string): boolean;
    lintFile(textDocument: any): Promise<Diagnostic[] | undefined>;
}
//# sourceMappingURL=linter.d.ts.map