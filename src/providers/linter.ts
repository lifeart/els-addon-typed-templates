import { getFullSemanticDiagnostics } from "../lib/ls-utils";
import { virtualComponentTemplateFileName } from "../lib/resolvers";
import { toFilePath } from '../lib/utils';

import { Project } from '../interfaces';
import { Diagnostic, TextDocument } from 'vscode-languageserver';
import { serviceForRoot, componentsForService, typeForPath } from '../lib/ts-service';
import VirtualDocumentProvider from './virtual-document';


function isTestFile(uri) {
    return uri.includes('tests');
}

export function setupLinter(project: Project, virtualDocument: VirtualDocumentProvider): Linter {
    const linter = new Linter(project, virtualDocument);
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
    constructor(private project: Project, private virtualDocument: VirtualDocumentProvider) { }
    canLint(templatePath: string) {
        const marks = ['components', 'component', 'templates'];
        const foundMarks = marks.filter((mark) => templatePath.includes(mark));
        if (isTestFile(templatePath) || foundMarks.length === 0 || templatePath.endsWith('.d.ts')) {
            return false;
        }
        // skip virtual files linting (if debug enabled)
        if (templatePath.includes('--virtual-')) {
            return false;
        }
        return true;
    }
    async lintFile(textDocument) {
        const templatePath = toFilePath(textDocument.uri);
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
        this.virtualDocument.createFullVirtualTemplate(componentsMap, templatePath, fullFileName,textDocument.uri, false, componentMeta);
        return getFullSemanticDiagnostics(service, fullFileName);
    }
}