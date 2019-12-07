"use strict";
exports.__esModule = true;
var vscode_uri_1 = require("vscode-uri");
var vscode_languageserver_1 = require("vscode-languageserver");
var fs = require("fs");
var utils_1 = require("./utils");
var ast_helpers_1 = require("./ast-helpers");
function normalizeDefinitions(results) {
    return (results || [])
        .map(function (el) {
        return tsDefinitionToLocation(el);
    });
}
exports.normalizeDefinitions = normalizeDefinitions;
function normalizeCompletions(tsResults, realPath, isArg) {
    return (tsResults ? tsResults.entries : [])
        .filter(function (_a) {
        var name = _a.name;
        return !name.startsWith("_t");
    })
        .map(function (el) {
        return {
            label: isArg
                ? ast_helpers_1.serializeArgumentName(realPath) + el.name
                : realPath + el.name,
            kind: utils_1.itemKind(el.kind)
        };
    });
}
exports.normalizeCompletions = normalizeCompletions;
function offsetToRange(start, limit, source) {
    var rLines = /(.*?(?:\r\n?|\n|$))/gm;
    var startLine = source.slice(0, start).match(rLines) || [];
    if (!source || startLine.length < 2) {
        return vscode_languageserver_1.Range.create(0, 0, 0, 0);
    }
    var line = startLine.length - 2;
    var col = startLine[startLine.length - 2].length;
    var endLine = source.slice(start, limit).match(rLines) || [];
    var endCol = col;
    var endLineNumber = line;
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
function tsDefinitionToLocation(el) {
    var scope = el.textSpan;
    var file = fs.readFileSync(el.fileName, "utf8");
    return vscode_languageserver_1.Location.create(vscode_uri_1.URI.file(el.fileName).toString(), offsetToRange(scope.start, scope.length, file));
}
exports.tsDefinitionToLocation = tsDefinitionToLocation;
function getSemanticDiagnostics(server, service, templateRange, fileName, focusPath, uri) {
    //  console.log(service.getSyntacticDiagnostics(fileName).map((el)=>{
    //     console.log('getSyntacticDiagnostics', el.messageText, el.start, el.length);
    // }));
    var tsDiagnostics = service.getSemanticDiagnostics(fileName);
    var diagnostics = tsDiagnostics.map(function (error) {
        return toDiagnostic(error, templateRange, focusPath);
    });
    server.connection.sendDiagnostics({ uri: uri, diagnostics: diagnostics });
    // console.log(service.getSemanticDiagnostics(fileName).map((el)=>{
    // const diagnostics: Diagnostic[] = errors.map((error: any) => toDiagnostic(el));
    // server.connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
    // console.log('getSemanticDiagnostics', el.messageText, el.start, el.length);
    // }));
    // console.log(service.getSuggestionDiagnostics(fileName).map((el)=>{
    //     console.log('getSuggestionDiagnostics', el.messageText, el.start, el.length);
    // }));
    // console.log('getCompilerOptionsDiagnostics', service.getCompilerOptionsDiagnostics());
}
exports.getSemanticDiagnostics = getSemanticDiagnostics;
function toDiagnostic(err, _a, focusPath) {
    var startIndex = _a[0], endIndex = _a[1];
    var errText = err.file.text.slice(err.start, err.start + err.length);
    if ((err.start >= startIndex && err.length + err.start <= endIndex) ||
        errText.startsWith("return ")) {
        var loc = focusPath.node.loc;
        return {
            severity: vscode_languageserver_1.DiagnosticSeverity.Error,
            range: loc
                ? vscode_languageserver_1.Range.create(loc.start.line - 1, loc.start.column, loc.end.line - 1, loc.end.column)
                : vscode_languageserver_1.Range.create(0, 0, 0, 0),
            message: err.messageText,
            source: "typed-templates"
        };
    }
    else {
        return {
            severity: vscode_languageserver_1.DiagnosticSeverity.Error,
            range: offsetToRange(0, 0, ""),
            message: err.messageText,
            source: "typed-templates"
        };
    }
}
exports.toDiagnostic = toDiagnostic;
