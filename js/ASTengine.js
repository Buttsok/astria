// ASTengine.js
async function parseTemplate() {
  const text = document.getElementById('templateText').value;
  try {
    const res = await fetch('/api/ast/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clauseId: 'dynamic-clause-1', text, dependencies: [] })
    });
    const data = await res.json();
    document.getElementById('astOutput').textContent = JSON.stringify(data.ast, null, 2);
  } catch (err) {
    document.getElementById('astOutput').textContent = 'Error connecting to backend server: ' + err.message;
  }
}

async function runConflictCheck() {
  const idsInput = document.getElementById('clauseIdsInput').value;
  const ids = idsInput.split(',').map(s => s.trim()).filter(Boolean);
  const resultDiv = document.getElementById('validationResult');

  try {
    const res = await fetch('/api/ast/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clauseIds: ids, context: { isPhilippineJurisdiction: true } })
    });
    const data = await res.json();
    
    if (data.conflictReport.isValid) {
      resultDiv.innerHTML = `<div class="alert-box alert-pass">Validation Passed! Zero conflicts detected. (Evaluation Time: ${data.conflictReport.metrics.evaluationTimeMs}ms)</div>`;
    } else {
      let errs = data.conflictReport.violations.map(v => `<li><b>${v.ruleId}</b>: ${v.message}</li>`).join('');
      resultDiv.innerHTML = `<div class="alert-box alert-fail">Conflicts Detected:<ul>${errs}</ul></div>`;
    }
  } catch (err) {
    resultDiv.innerHTML = `<div class="alert-box alert-fail">Network error running conflict detector: ${err.message}</div>`;
  }
}