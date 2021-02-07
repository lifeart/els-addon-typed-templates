import { URI } from "vscode-uri";
import * as ts from "typescript";
import {
  Location,
  Range,
  DiagnosticSeverity,
  Diagnostic
} from "vscode-languageserver";
import * as fs from "fs";
import * as path from "path";
import { itemKind } from './utils';
import { serializeArgumentName } from './ast-helpers';

export function normalizeDefinitions(results, root: string) {
  return (results || [])
      .map(el => {
        return tsDefinitionToLocation(el, root);
      }).filter((el) => el !== null);
}

const ignoreNames = ['willDestroy', 'toString'];

export function normalizeCompletions(tsResults, realPath, isArg) {
  return (tsResults ? tsResults.entries : [])
  .filter(({ name }) => !ignoreNames.includes(name) && !name.startsWith("_t") && !name.includes(' - ') && name !== 'globalScope' && name !== 'defaultYield')
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

export function tsDefinitionToLocation(el, root) {
  let scope = el.textSpan;
  let fullPath = path.resolve(el.fileName);
  if (!fs.existsSync(fullPath)) {
    fullPath = path.resolve(path.join(root, el.fileName));
    if (!fs.existsSync(fullPath)) {
      return null;
    }
  }
  let file = fs.readFileSync(fullPath, "utf8");
  return Location.create(
    URI.file(fullPath).toString(),
    offsetToRange(scope.start, scope.length, file)
  );
}


function messageConverter(msg) {

  if (msg.startsWith("The 'this' context of type 'this' is not assignable to method's 'this' of type 'null'.")) {
    return "Unable to find context, is file created and property defined?"
  }

  console.log(msg);
  return msg;
}


function getSeverity(msg: string): DiagnosticSeverity {
  let severity: DiagnosticSeverity = DiagnosticSeverity.Error;
  if (msg.startsWith("Object is possibly 'undefined'")) {
    severity = DiagnosticSeverity.Warning;
  } else if (msg.startsWith("Object is possibly 'null'")) {
    severity = DiagnosticSeverity.Warning;
  }
  return severity;
}

function toFullDiagnostic(err: ts.Diagnostic) {
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
  } else {
    let preError = preErrorText.slice(preErrorText.lastIndexOf('//@mark'), preErrorText.length);
    let mark = preError.slice(preError.indexOf('[') + 1, preError.indexOf(']')).trim();
    [start, end] = mark.split(':');
  }

  if (! start || ! end) {
    let postError = err.file.text.slice(err.start, err.file.text.length);
    let postErrorMark = postError.slice(postError.indexOf('/*@path-mark ') + 13,postError.indexOf('*/'));
    [start, end] = postErrorMark.split(':');

    if (!start || ! end) {
      console.log(err);
      return null;
    }
  }
  // console.log({mark, start, end})
  // console.log('preErrorText',preErrorText.slice(preErrorText.lastIndexOf('//@mark ') + 8, preErrorText.lastIndexOf('//@mark ') + 40));
  let [startCol, startRow] =  start.split(',').map((e)=>parseInt(e, 10));
  let [endCol, endRow] =  end.split(',').map((e)=>parseInt(e, 10));
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
    range: Range.create(startCol - 1, startRow, endCol - 1, endRow),
    message: messageConverter(msgText),
    source: "typed-templates"
  };
}

// regards to https://github.com/dfreeman/ember-typed-templates-vscode/blob/master/src/server/server.ts#L172
function diagnosticToString(message: string | ts.DiagnosticMessageChain, indent = ''): string {
  if (typeof message === 'string') {
    return `${indent}${message}`;
  } else if (message.next && message.next.length) {
    let items = message.next.map((msg)=>diagnosticToString(msg, `${indent}  `))
    return `${indent}${message.messageText}\n${items.join('\n')}`;
  } else {
    return `${indent}${message.messageText}`;
  }
}


export function getFullSemanticDiagnostics(service:  ts.LanguageService, fileName) {
  const tsDiagnostics = service.getSemanticDiagnostics(fileName);
  const results = tsDiagnostics.map((error: any) =>
    toFullDiagnostic(error)
  ).filter((el)=>el !== null);
  const diagnostics: Diagnostic[] = results as Diagnostic[];
  return diagnostics;
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
      severity: getSeverity(err.messageText),
      range: loc
        ? Range.create(
            loc.start.line - 1,
            loc.start.column,
            loc.end.line - 1,
            loc.end.column
          )
        : Range.create(0, 0, 0, 0),
      message: messageConverter(err.messageText),
      source: "typed-templates"
    };
  } else {
    return {
      severity: getSeverity(err.messageText),
      range: offsetToRange(0, 0, ""),
      message: messageConverter(err.messageText),
      source: "typed-templates"
    };
  }
}
