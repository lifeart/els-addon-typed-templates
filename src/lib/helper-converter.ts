const ts = require('ts-morph');

const Project = ts.Project;
const tNode = ts.Node;

export function getHelper(filePath) {

  const project = new Project({ compilerOptions: { allowJs: true } });

  const helperFile = project.addSourceFileAtPath(filePath);

  const defaultExportSymbol = helperFile.getDefaultExportSymbol();

  if (defaultExportSymbol) {
    const declaration = defaultExportSymbol.getDeclarations()[0];
    if (declaration && tNode.isExportAssignment(declaration)) {
      let helperWrapper = declaration.getExpression();
      let helper;
      let helperWrapperDefinition;
      if (tNode.isIdentifier(helperWrapper)) {
        helperWrapperDefinition = helperWrapper.getDefinitionNodes()[0];
        helperWrapper = helperWrapperDefinition.getChildren().slice(-1)[0];
      }

      helper = helperWrapper.getArguments()[0];
      if (tNode.isIdentifier(helper)) {
        helper = helper.getDefinitionNodes()[0];
      }

      if (helper.isExported && helper.isExported()) {
        helper.setIsExported(false);
      }

      const txt = helper.getFullText();
      helper.remove();
      helperWrapperDefinition?.remove();
      declaration.remove();

      return `${helperFile.getFullText()} export default ${txt}`;
    }
  }
  return null;
}
