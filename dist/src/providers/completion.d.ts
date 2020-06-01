import { Project, CompletionFunctionParams } from '../interfaces';
import { CompletionItem } from 'vscode-languageserver';
export default class CompletionProvider {
    private project;
    constructor(project: Project);
    onComplete({ results, focusPath, type, textDocument }: CompletionFunctionParams): Promise<CompletionItem[] | null>;
}
//# sourceMappingURL=completion.d.ts.map