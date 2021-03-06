"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupLinter = void 0;
const ls_utils_1 = require("../lib/ls-utils");
const resolvers_1 = require("../lib/resolvers");
const utils_1 = require("../lib/utils");
const ts_service_1 = require("../lib/ts-service");
function isTestFile(uri) {
    return uri.includes('tests');
}
function setupLinter(project, virtualDocument) {
    const linter = new Linter(project, virtualDocument);
    const lintFn = (document) => __awaiter(this, void 0, void 0, function* () {
        let results = [];
        try {
            results = yield linter.lintFile(document);
            return results;
        }
        catch (e) {
            console.log(e);
        }
        return null;
    });
    project.addLinter(lintFn);
    return linter;
}
exports.setupLinter = setupLinter;
class Linter {
    constructor(project, virtualDocument) {
        this.project = project;
        this.virtualDocument = virtualDocument;
    }
    canLint(templatePath) {
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
    lintFile(textDocument) {
        return __awaiter(this, void 0, void 0, function* () {
            const templatePath = utils_1.toFilePath(textDocument.uri);
            if (!this.canLint(templatePath)) {
                return [];
            }
            const projectRoot = this.project.root;
            const service = ts_service_1.serviceForRoot(projectRoot);
            const componentsMap = ts_service_1.componentsForService(service);
            const componentMeta = ts_service_1.typeForPath(projectRoot, templatePath);
            if (!componentMeta) {
                return;
            }
            const fullFileName = resolvers_1.virtualComponentTemplateFileName(templatePath);
            this.virtualDocument.createFullVirtualTemplate(componentsMap, templatePath, fullFileName, textDocument.uri, false, componentMeta);
            return ls_utils_1.getFullSemanticDiagnostics(service, fullFileName);
        });
    }
}
exports.default = Linter;
//# sourceMappingURL=linter.js.map