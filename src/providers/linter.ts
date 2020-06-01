import { getFullSemanticDiagnostics } from "../lib/ls-utils";
import { URI } from "vscode-uri";
import { virtualComponentTemplateFileName } from "../lib/resolvers";

import { Project, Server } from '../interfaces';
import { Diagnostic, TextDocument } from 'vscode-languageserver';
import { serviceForRoot, componentsForService, typeForPath } from '../lib/ts-service';
import { createFullVirtualTemplate } from "../lib/virtual-documents";


function isTestFile(uri) {
    return uri.includes('tests');
}

export function setupLinter(project: Project, server: Server): Linter {
    const linter = new Linter(server, project);
    project.addLinter(async (document: TextDocument): Promise<Diagnostic[] | null> => {
        let results: Diagnostic[] | undefined = [];
        try {
            results = await linter.lintFile(document)
            return results as Diagnostic[];
        } catch (e) {
            console.log(e);
        }
        return null;
    });
    return linter;
}


export default class Linter {
    constructor(private server: Server, private project: Project) {}
    canLint(templatePath: string) {
        const marks = ['components', 'component', 'templates'];
        const foundMarks = marks.filter((mark) => templatePath.includes(mark));
        if (isTestFile(templatePath) || foundMarks.length === 0 || templatePath.endsWith('.d.ts')) {
            return false;
        }
        return true;
    }
    async lintFile(textDocument) {
        const templatePath = URI.parse(textDocument.uri).fsPath;
        if (!this.canLint(templatePath)) {
            return [];
        }
        const projectRoot = this.project.root;
        const service = serviceForRoot(projectRoot);
        const componentsMap = componentsForService(service);
        const componentMeta = typeForPath(projectRoot, templatePath);
        if (!componentMeta) {
            return;
        }
        const fullFileName = virtualComponentTemplateFileName(templatePath);
        createFullVirtualTemplate(projectRoot, componentsMap, templatePath, fullFileName, this.server, textDocument.uri, false, componentMeta);
        return getFullSemanticDiagnostics(service, fullFileName);
    }
}