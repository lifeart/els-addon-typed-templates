import * as fs from "fs";
import * as walkSync from "walk-sync";
import {
  CompletionItemKind
} from "vscode-languageserver";
import { URI } from "vscode-uri";
import * as path from "path";

export function safeWalkSync(filePath, opts) {
  if (!filePath) {
    return [];
  }
  if (!fs.existsSync(filePath)) {
    return [];
  }
  return walkSync(filePath, opts);
}

// https://github.com/rwjblue/ember-angle-bracket-invocation-polyfill/blob/master/lib/ast-transform.js#L33
export function normalizeAngleTagName(name: string) {
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

export const PLACEHOLDER = "ELSCompletionDummy";

export function mergeResults(existingResults, newResults) {
  let indexes = new Set();
  let existingResultsMap: any = existingResults.reduce((hash, item) => {
    hash[item.label] = item;
    indexes.add(item.label);
    return hash;
  }, {});
  newResults.forEach(el => {
    if (el.label in existingResultsMap) {
      Object.keys(el).forEach(key => {
        existingResultsMap[el.label][key] = el[key];
      });
    } else {
      existingResultsMap[el.label] = el;
      indexes.add(el.label);
    }
  });
  return Array.from(indexes).map(key => {
    return existingResultsMap[key as string];
  });
}


export function itemKind(tsName) {
  const kinds = {
    method: CompletionItemKind.Method,
    function: CompletionItemKind.Function,
    constructor: CompletionItemKind.Constructor,
    field: CompletionItemKind.Field,
    variable: CompletionItemKind.Variable,
    class: CompletionItemKind.Class,
    struct: CompletionItemKind.Struct,
    interface: CompletionItemKind.Interface,
    module: CompletionItemKind.Module,
    property: CompletionItemKind.Property,
    event: CompletionItemKind.Event,
    operator: CompletionItemKind.Operator,
    unit: CompletionItemKind.Unit,
    value: CompletionItemKind.Value,
    constant: CompletionItemKind.Constant,
    enum: CompletionItemKind.Enum,
    "enum-member": CompletionItemKind.EnumMember,
    keyword: CompletionItemKind.Keyword,
    snippet: CompletionItemKind.Snippet,
    text: CompletionItemKind.Text,
    file: CompletionItemKind.File,
    reference: CompletionItemKind.Reference,
    folder: CompletionItemKind.Folder,
    "type-parameter": CompletionItemKind.TypeParameter
  };

  return kinds[tsName] || CompletionItemKind.Property;
}

export function toFilePath(uri) {
  return path.resolve(URI.parse(uri).fsPath);
}

export function normalizeToAngleBracketName(name) {
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
