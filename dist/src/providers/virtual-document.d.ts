import { MatchResult } from './../lib/ts-service';
import { TypescriptTemplateBuilder } from "./../lib/hbs-converter";
import { Project, Server } from '@lifeart/ember-language-server';
export default class VirtualDocumentProvider {
    private server;
    private project;
    builder: TypescriptTemplateBuilder;
    constructor(server: Server, project: Project);
    unknownComponentTemplate(meta: any): string;
    createFullVirtualTemplate(componentsMap: any, templatePath: any, fileName: any, uri: any, content: string | boolean | undefined, meta: MatchResult): any;
    createVirtualTemplate(componentsMap: any, fileName: any, { templatePath, realPath, isArg, isArrayCase, isParam }: any): {
        pos: any;
        posStart: number;
    };
    private getBasicComponent;
}
//# sourceMappingURL=virtual-document.d.ts.map