import { getFullSemanticDiagnostics } from "./lib/ls-utils";
import { URI } from "vscode-uri";
import { virtualComponentTemplateFileName } from "./lib/resolvers";

import { Project, Server } from './interfaces';
import { Diagnostic } from 'vscode-languageserver';
import { serviceForRoot, componentsForService, typeForPath } from './lib/ts-service';
import { createFullVirtualTemplate } from "./lib/virtual-documents";


function isTestFile(uri) {
    return uri.includes('tests');
}

export function setupLinter(root, project: Project, server: Server) {
    project.addLinter(async (document: any): Promise<Diagnostic[] | null> => {
        let results: any = [];
        try {
            results = await lintFile(root, document, server)
            return results as Diagnostic[];
        } catch (e) {
            console.log(e);
        }
        return null;
    });
}

function lintFile(root, textDocument, server) {
    const templatePath = URI.parse(textDocument.uri).fsPath;
    const marks = ['components', 'component', 'templates'];
    const foundMarks = marks.filter((mark) => templatePath.includes(mark));
    if (isTestFile(templatePath) || foundMarks.length === 0 || templatePath.endsWith('.d.ts')) {
        return [];
    }
    const projectRoot = URI.parse(root).fsPath;
    const service = serviceForRoot(projectRoot);
    const componentsMap = componentsForService(service);
    const componentMeta = typeForPath(projectRoot, templatePath);
    if (!componentMeta) {
        return;
    }
    const fullFileName = virtualComponentTemplateFileName(templatePath);
    createFullVirtualTemplate(projectRoot, componentsMap, templatePath, fullFileName, server, textDocument.uri, false, componentMeta);
    return getFullSemanticDiagnostics(service, fullFileName);
}
