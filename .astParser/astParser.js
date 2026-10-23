// astParser.js
class ASTParser {
  parseClauseTemplate(clauseId, rawText, dependencies = []) {
    const variables = this.extractVariables(rawText);
    const conditions = this.extractConditions(rawText);

    const rootNode = {
      type: 'CLAUSE',
      id: clauseId,
      text: rawText,
      variables,
      dependencies,
      children: []
    };

    if (conditions.length > 0) {
      conditions.forEach((cond, idx) => {
        rootNode.children.push({
          type: 'CONDITIONAL',
          id: `${clauseId}-cond-${idx + 1}`,
          condition: cond.expression,
          text: cond.blockText,
          variables: this.extractVariables(cond.blockText),
          children: []
        });
      });
    }

    return rootNode;
  }

  extractVariables(text) {
    const regex = /\{\{([\w.]+)\}\}/g;
    const matches = new Set();
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.add(match[1]);
    }
    return Array.from(matches);
  }

  extractConditions(text) {
    const condRegex = /#IF\s*\(([^)]+)\)\s*\{([^}]+)\}/g;
    const conditions = [];
    let match;
    while ((match = condRegex.exec(text)) !== null) {
      conditions.push({
        expression: match[1].trim(),
        blockText: match[2].trim()
      });
    }
    return conditions;
  }
}

module.exports = { ASTParser };