import { URI } from "vscode-uri";

import {
  Location,
  Range,
  DiagnosticSeverity,
  Diagnostic
} from "vscode-languageserver";
import * as fs from "fs";

import { itemKind } from './utils';
import { serializeArgumentName } from './ast-helpers';

export function normalizeDefinitions(results) {
  return (results || [])
      .map(el => {
        return tsDefinitionToLocation(el);
      });
}

export function normalizeCompletions(tsResults, realPath, isArg) {
  return (tsResults ? tsResults.entries : [])
  .filter(({ name }) => !name.startsWith("_t"))
  .map(el => {
    return {
      label: isArg
        ? serializeArgumentName(realPath) + el.name
        : realPath + el.name,
      data: el.name,
      kind: itemKind(el.kind)
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

export function offsetToRange(start, limit, source) {
  let rLines = /(.*?(?:\r\n?|\n|$))/gm;
  let startLine = source.slice(0, start).match(rLines) || [];
  if (!source || startLine.length < 2) {
    return Range.create(0, 0, 0, 0);
  }
  let line = startLine.length - 2;
  let col = startLine[startLine.length - 2].length;
  let endLine = source.slice(start, limit).match(rLines) || [];
  let endCol = col;
  let endLineNumber = line;
  if (endLine.length === 1) {
    endCol = col + limit;
    endLineNumber = line + endLine.length - 1;
  } else {
    endCol = endLine[endLine.length - 1].length;
  }
  return Range.create(line, col, endLineNumber, endCol);
}

export function tsDefinitionToLocation(el) {
  let scope = el.textSpan;
  let file = fs.readFileSync(el.fileName, "utf8");
  return Location.create(
    URI.file(el.fileName).toString(),
    offsetToRange(scope.start, scope.length, file)
  );
}

function toFullDiagnostic(err) {
  let preErrorText = err.file.text.slice(0, err.start);
  let preError = preErrorText.slice(preErrorText.lastIndexOf('//@mark'), preErrorText.length);
  let mark = preError.slice(preError.indexOf('[') + 1, preError.indexOf(']')).trim();
  let [start, end] = mark.split(':');
  let [startCol, startRow] =  start.split(',').map((e)=>parseInt(e, 10));
  let [endCol, endRow] =  end.split(',').map((e)=>parseInt(e, 10));
  return {
    severity: DiagnosticSeverity.Error,
    range: Range.create(startCol - 1, startRow, endCol - 1, endRow),
    message: err.messageText,
    source: "typed-templates"
  };
}

export function getFullSemanticDiagnostics(server, service, fileName, uri) {
  const tsDiagnostics = service.getSemanticDiagnostics(fileName);
  const diagnostics: Diagnostic[] = tsDiagnostics.map((error: any) =>
    toFullDiagnostic(error)
  );
  server.connection.sendDiagnostics({ uri, diagnostics });
}

export function getSemanticDiagnostics(server, service, templateRange, fileName , focusPath, uri) {
  //  console.log(service.getSyntacticDiagnostics(fileName).map((el)=>{
      //     console.log('getSyntacticDiagnostics', el.messageText, el.start, el.length);
      // }));
      // console.log('getSemanticDiagnostics', fileName);

      const tsDiagnostics = service.getSemanticDiagnostics(fileName);
      const diagnostics: Diagnostic[] = tsDiagnostics.map((error: any) =>
        toDiagnostic(error, templateRange, focusPath)
      );
      server.connection.sendDiagnostics({ uri, diagnostics });
  
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

export function toDiagnostic(
  err,
  [startIndex, endIndex],
  focusPath
): Diagnostic {
  let errText = err.file.text.slice(err.start, err.start + err.length);
  if (
    (err.start >= startIndex && err.length + err.start <= endIndex) ||
    errText.startsWith("return ")
  ) {
    let loc = focusPath.node.loc;
    return {
      severity: DiagnosticSeverity.Error,
      range: loc
        ? Range.create(
            loc.start.line - 1,
            loc.start.column,
            loc.end.line - 1,
            loc.end.column
          )
        : Range.create(0, 0, 0, 0),
      message: err.messageText,
      source: "typed-templates"
    };
  } else {
    return {
      severity: DiagnosticSeverity.Error,
      range: offsetToRange(0, 0, ""),
      message: err.messageText,
      source: "typed-templates"
    };
  }
}
