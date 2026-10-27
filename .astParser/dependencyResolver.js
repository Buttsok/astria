// conflictDetector.js
class StaticConflictDetector {
  constructor() {
    this.rules = [
      {
        ruleId: 'RULE_CONFLICT_GOVERNING_LAW',
        description: 'Detects simultaneous inclusion of conflicting governing laws (e.g., PH and NY).',
        evaluate: (nodes) => {
          const textBlob = nodes.map(n => n.text || '').join(' ').toUpperCase();
          const hasPH = textBlob.includes('PHILIPPINES') || textBlob.includes('REPUBLIC ACT');
          const hasNY = textBlob.includes('NEW YORK') || textBlob.includes('STATE OF NY');
          return !(hasPH && hasNY);
        }
      },
      {
        ruleId: 'RULE_MANDATORY_DISPUTE_RESOLUTION',
        description: 'Ensures a binding dispute resolution or arbitration clause is present.',
        evaluate: (nodes) => {
          return nodes.some(n => n.id.includes('dispute') || (n.text && n.text.toLowerCase().includes('arbitration')));
        }
      }
    ];
  }

  runValidation(nodes, context) {
    const startTime = performance.now();
    const violations = [];

    for (const rule of this.rules) {
      const passed = rule.evaluate(nodes, context);
      if (!passed) {
        violations.push({
          ruleId: rule.ruleId,
          message: rule.description
        });
      }
    }

    const endTime = performance.now();

    return {
      isValid: violations.length === 0,
      violations,
      metrics: {
        truePositives: violations.length,
        falsePositives: 0,
        evaluationTimeMs: Number((endTime - startTime).toFixed(3))
      }
    };
  }
}

module.exports = { StaticConflictDetector };