import { Project, DefinitionFunctionParams } from '../interfaces';
export default class DefinitionProvider {
    private project;
    constructor(project: Project);
    onDefinition({ results, focusPath, type, textDocument }: DefinitionFunctionParams): Promise<any>;
}
//# sourceMappingURL=definition.d.ts.map