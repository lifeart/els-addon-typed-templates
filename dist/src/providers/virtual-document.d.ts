import { MatchResult } from './../lib/ts-service';
import { Project, Server } from './../interfaces';
export default class VirtualDocumentProvider {
    private server;
    private project;
    constructor(server: Server, project: Project);
    createFullVirtualTemplate(componentsMap: any, templatePath: any, fileName: any, uri: any, content: string | boolean | undefined, meta: MatchResult): any;
    createVirtualTemplate(componentsMap: any, fileName: any, { templatePath, realPath, isArg, isArrayCase, isParam }: any): {
        pos: any;
        posStart: number;
    };
    private getBasicComponent;
}
//# sourceMappingURL=virtual-document.d.ts.map