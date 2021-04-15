"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFullSemanticDiagnostics = exports.tsDefinitionToLocation = exports.offsetToRange = exports.normalizeCompletions = exports.normalizeDefinitions = void 0;
const vscode_uri_1 = require("vscode-uri");
const vscode_languageserver_1 = require("vscode-languageserver");
const fs = require("fs");
const path = require("path");
const utils_1 = require("./utils");
const ast_helpers_1 = require("./ast-helpers");
function normalizeDefinitions(results, root) {
    return (results || [])
        .map(el => {
        return tsDefinitionToLocation(el, root);
    }).filter((el) => el !== null);
}
exports.normalizeDefinitions = normalizeDefinitions;
const ignoreNames = ['willDestroy', 'toString'];
function normalizeCompletions(tsResults, realPath, isArg) {
    return (tsResults ? tsResults.entries : [])
        .filter(({ name }) => !ignoreNames.includes(name) && !name.startsWith("_t") && !name.includes(' - ') && name !== 'globalScope' && name !== 'defaultYield')
        .map(el => {
        return {
            label: isArg
                ? ast_helpers_1.serializeArgumentName(realPath) + el.name
                : realPath + el.name,
            data: el.name,
            kind: utils_1.itemKind(el.kind)
        };
    });
    // .map(el => {
    //   let fixedLabelParts = el.label.split('.');
    //   fixedLabelParts[fixedLabelParts.length - 1] = el.data;
    //   return {
    //     kind: el.kind,
    //     label: fixedLabelParts.join('.')
    //   }
    // });
}
exports.normalizeCompletions = normalizeCompletions;
function offsetToRange(start, limit, source) {
    let rLines = /(.*?(?:\r\n?|\n|$))/gm;
    let startLine = source.slice(0, start).match(rLines) || [];
    if (!source || startLine.length < 2) {
        return vscode_languageserver_1.Range.create(0, 0, 0, 0);
    }
    let line = startLine.length - 2;
    let col = startLine[startLine.length - 2].length;
    let endLine = source.slice(start, limit).match(rLines) || [];
    let endCol = col;
    let endLineNumber = line;
    if (endLine.length === 1) {
        endCol = col + limit;
        endLineNumber = line + endLine.length - 1;
    }
    else {
        endCol = endLine[endLine.length - 1].length;
    }
    return vscode_languageserver_1.Range.create(line, col, endLineNumber, endCol);
}
exports.offsetToRange = offsetToRange;
function tsDefinitionToLocation(el, root) {
    let scope = el.textSpan;
    let fullPath = path.resolve(el.fileName);
    if (!fs.existsSync(fullPath)) {
        fullPath = path.resolve(path.join(root, el.fileName));
        if (!fs.existsSync(fullPath)) {
            return null;
        }
    }
    let file = fs.readFileSync(fullPath, "utf8");
    return vscode_languageserver_1.Location.create(vscode_uri_1.URI.file(fullPath).toString(), offsetToRange(scope.start, scope.length, file));
}
exports.tsDefinitionToLocation = tsDefinitionToLocation;
function messageConverter(msg) {
    if (msg.startsWith("The 'this' context of type 'this' is not assignable to method's 'this' of type 'null'.")) {
        return "Unable to find context, is file created and property defined?";
    }
    console.log(msg);
    return msg;
}
function getSeverity(msg) {
    let severity = vscode_languageserver_1.DiagnosticSeverity.Error;
    if (msg.startsWith("Object is possibly 'undefined'")) {
        severity = vscode_languageserver_1.DiagnosticSeverity.Warning;
    }
    else if (msg.startsWith("Object is possibly 'null'")) {
        severity = vscode_languageserver_1.DiagnosticSeverity.Warning;
    }
    return severity;
}
function toFullDiagnostic(err) {
    if (!err.file || err.start === undefined) {
        return null;
    }
    let preErrorText = err.file.text.slice(0, err.start);
    let postErrorText = err.file.text.slice(err.start, err.file.text.length);
    // try {
    //   console.log('err.file.fileName', err.file.fileName);
    //   console.log('start', err.start);
    //   console.log('err.slice', err.file.text.slice(err.start, 100));
    //   console.log('err.code', err.code);
    //   console.log('err.category', err.category);
    //   console.log('err.related', err.relatedInformation);
    //   console.log('err.source', err.source);
    //   console.log('err.msg', err.messageText);
    // } catch(e) {
    //   console.log('err:', e);
    // }
    if (err.start < err.file.text.indexOf('@mark-meaningful-issues-start')) {
        return null;
    }
    let closestLeftMark = postErrorText.indexOf('["');
    let closestRightMarkOffset = postErrorText.indexOf('"]');
    let maybeMark = err.file.text.slice(closestLeftMark + err.start, closestRightMarkOffset + err.start);
    let hasNewline = err.file.text.slice(err.start, err.start + closestLeftMark).split('\n').length > 1;
    maybeMark = maybeMark.slice(maybeMark.indexOf('[') + 2, maybeMark.indexOf(']')).trim().split(' - ')[0];
    let start, end;
    if (maybeMark.includes(':') && !hasNewline) {
        [start, end] = maybeMark.split(':');
    }
    else {
        let preError = preErrorText.slice(preErrorText.lastIndexOf('//@mark'), preErrorText.length);
        let mark = preError.slice(preError.indexOf('[') + 1, preError.indexOf(']')).trim();
        [start, end] = mark.split(':');
    }
    if (!start || !end) {
        let postError = err.file.text.slice(err.start, err.file.text.length);
        let postErrorMark = postError.slice(postError.indexOf('/*@path-mark ') + 13, postError.indexOf('*/'));
        [start, end] = postErrorMark.split(':');
        if (!start || !end) {
            console.log(err);
            return null;
        }
    }
    // console.log({mark, start, end})
    // console.log('preErrorText',preErrorText.slice(preErrorText.lastIndexOf('//@mark ') + 8, preErrorText.lastIndexOf('//@mark ') + 40));
    let [startCol, startRow] = start.split(',').map((e) => parseInt(e, 10));
    let [endCol, endRow] = end.split(',').map((e) => parseInt(e, 10));
    let msgText = diagnosticToString(err.messageText);
    /*
      since ember components in addons may be like
      ... export default Ember.Component.extend(Base, PromiseResolver, {
      it's really tricky to get typings for it at all, and I prefer to skip warnings for it in next lines
    */
    if (msgText.startsWith("Object is of type 'unknown'")) {
        return null;
    }
    if (msgText.startsWith("Type 'any' is not assignable to type 'never'")) {
        return null;
    }
    if (msgText.startsWith("Property 'args' does not exist on type")) {
        return null;
    }
    if (msgText.startsWith("Expected 0 arguments, but got 2.")) {
        return null;
    }
    if (msgText.startsWith("Cannot invoke an object which is possibly")) {
        return null;
    }
    return {
        severity: getSeverity(msgText),
        range: vscode_languageserver_1.Range.create(startCol - 1, startRow, endCol - 1, endRow),
        message: messageConverter(msgText),
        source: "typed-templates"
    };
}
// regards to https://github.com/dfreeman/ember-typed-templates-vscode/blob/master/src/server/server.ts#L172
function diagnosticToString(message, indent = '') {
    if (typeof message === 'string') {
        return `${indent}${message}`;
    }
    else if (message.next && message.next.length) {
        let items = message.next.map((msg) => diagnosticToString(msg, `${indent}  `));
        return `${indent}${message.messageText}\n${items.join('\n')}`;
    }
    else {
        return `${indent}${message.messageText}`;
    }
}
function getFullSemanticDiagnostics(service, fileName) {
    const tsDiagnostics = service.getSemanticDiagnostics(fileName);
    const results = tsDiagnostics.map((error) => toFullDiagnostic(error)).filter((el) => el !== null);
    const diagnostics = results;
    return diagnostics;
}
exports.getFullSemanticDiagnostics = getFullSemanticDiagnostics;
//# sourceMappingURL=ls-utils.js.map