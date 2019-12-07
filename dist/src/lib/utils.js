"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const walkSync = require("walk-sync");
const vscode_languageserver_1 = require("vscode-languageserver");
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
//# sourceMappingURL=utils.js.map