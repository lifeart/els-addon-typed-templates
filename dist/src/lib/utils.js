"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const walkSync = require("walk-sync");
const vscode_languageserver_1 = require("vscode-languageserver");
const vscode_uri_1 = require("vscode-uri");
const path = require("path");
function safeWalkSync(filePath, opts) {
    if (!filePath) {
        return [];
    }
    if (!fs.existsSync(filePath)) {
        return [];
    }
    return walkSync(filePath, opts);
}
exports.safeWalkSync = safeWalkSync;
// https://github.com/rwjblue/ember-angle-bracket-invocation-polyfill/blob/master/lib/ast-transform.js#L33
function normalizeAngleTagName(name) {
    const ALPHA = /[A-Za-z]/;
    return name
        .replace(/[A-Z]/g, (char, index) => {
        if (index === 0 || !ALPHA.test(name[index - 1])) {
            return char.toLowerCase();
        }
        return `-${char.toLowerCase()}`;
    })
        .replace(/::/g, '/');
}
exports.normalizeAngleTagName = normalizeAngleTagName;
exports.PLACEHOLDER = "ELSCompletionDummy";
function mergeResults(existingResults, newResults) {
    let indexes = new Set();
    let existingResultsMap = existingResults.reduce((hash, item) => {
        hash[item.label] = item;
        indexes.add(item.label);
        return hash;
    }, {});
    newResults.forEach(el => {
        if (el.label in existingResultsMap) {
            Object.keys(el).forEach(key => {
                existingResultsMap[el.label][key] = el[key];
            });
        }
        else {
            existingResultsMap[el.label] = el;
            indexes.add(el.label);
        }
    });
    return Array.from(indexes).map(key => {
        return existingResultsMap[key];
    });
}
exports.mergeResults = mergeResults;
function itemKind(tsName) {
    const kinds = {
        method: vscode_languageserver_1.CompletionItemKind.Method,
        function: vscode_languageserver_1.CompletionItemKind.Function,
        constructor: vscode_languageserver_1.CompletionItemKind.Constructor,
        field: vscode_languageserver_1.CompletionItemKind.Field,
        variable: vscode_languageserver_1.CompletionItemKind.Variable,
        class: vscode_languageserver_1.CompletionItemKind.Class,
        struct: vscode_languageserver_1.CompletionItemKind.Struct,
        interface: vscode_languageserver_1.CompletionItemKind.Interface,
        module: vscode_languageserver_1.CompletionItemKind.Module,
        property: vscode_languageserver_1.CompletionItemKind.Property,
        event: vscode_languageserver_1.CompletionItemKind.Event,
        operator: vscode_languageserver_1.CompletionItemKind.Operator,
        unit: vscode_languageserver_1.CompletionItemKind.Unit,
        value: vscode_languageserver_1.CompletionItemKind.Value,
        constant: vscode_languageserver_1.CompletionItemKind.Constant,
        enum: vscode_languageserver_1.CompletionItemKind.Enum,
        "enum-member": vscode_languageserver_1.CompletionItemKind.EnumMember,
        keyword: vscode_languageserver_1.CompletionItemKind.Keyword,
        snippet: vscode_languageserver_1.CompletionItemKind.Snippet,
        text: vscode_languageserver_1.CompletionItemKind.Text,
        file: vscode_languageserver_1.CompletionItemKind.File,
        reference: vscode_languageserver_1.CompletionItemKind.Reference,
        folder: vscode_languageserver_1.CompletionItemKind.Folder,
        "type-parameter": vscode_languageserver_1.CompletionItemKind.TypeParameter
    };
    return kinds[tsName] || vscode_languageserver_1.CompletionItemKind.Property;
}
exports.itemKind = itemKind;
function toFilePath(uri) {
    return path.resolve(vscode_uri_1.URI.parse(uri).fsPath);
}
exports.toFilePath = toFilePath;
function isHBS(file) {
    return file.endsWith('.hbs');
}
exports.isHBS = isHBS;
function isJS(file) {
    return file.endsWith('.js');
}
exports.isJS = isJS;
function isTS(file) {
    return file.endsWith('.ts');
}
exports.isTS = isTS;
function normalizeToAngleBracketName(name) {
    const SIMPLE_DASHERIZE_REGEXP = /[a-z]|\/|-/g;
    const ALPHA = /[A-Za-z0-9]/;
    if (name.includes(".")) {
        return name;
    }
    return name.replace(SIMPLE_DASHERIZE_REGEXP, (char, index) => {
        if (char === "/") {
            return "";
        }
        if (index === 0 || !ALPHA.test(name[index - 1])) {
            return char.toUpperCase();
        }
        // Remove all occurrences of '-'s from the name that aren't starting with `-`
        return char === "-" ? "" : char.toLowerCase();
    });
}
exports.normalizeToAngleBracketName = normalizeToAngleBracketName;
//# sourceMappingURL=utils.js.map