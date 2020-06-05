import { LSRegistry } from './ts-service';
import { Project } from '../../dist/src/interfaces';
export declare function virtualTemplateFileName(fsPath: any): string;
export declare function virtualComponentTemplateFileName(fsPath: any): string;
export declare function relativeImport(templateFile: any, scriptFile: any): string;
export declare function relativeAddonImport(templateFileName: string, addonItemFileName: string): string | null;
export declare function relativeComponentImport(templateFileName: string, scriptForComponent: string): string | null;
export declare function findComponentForTemplate(fsPath: any, project: Project, registry: LSRegistry): string | null;
//# sourceMappingURL=resolvers.d.ts.map