// server.js
const express = require('express');
const { ASTParser } = require('./astParser');
const { DependencyResolver } = require('./dependencyResolver');
const { StaticConflictDetector } = require('./conflictDetector');

const app = express();
app.use(express.json());
app.use(express.static('.')); // Serves your HTML/CSS files from root

const parser = new ASTParser();
const resolver = new DependencyResolver();
const detector = new StaticConflictDetector();

app.post('/api/ast/parse', (req, res) => {
  try {
    const { clauseId, text, dependencies } = req.body;
    const ast = parser.parseClauseTemplate(clauseId, text, dependencies || []);
    resolver.registerClause(ast);
    res.json({ success: true, ast });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/ast/validate', (req, res) => {
  try {
    const { clauseIds, context } = req.body;
    const { executionQueue, missingPrerequisites } = resolver.resolveDependencies(clauseIds || [], context || {});
    
    const report = detector.runValidation([], context || {});

    res.json({
      success: true,
      executionQueue,
      missingPrerequisites,
      conflictReport: report
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Astria AST Dependency & Conflict Engine running at http://localhost:${PORT}`);
});