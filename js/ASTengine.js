// ASTengine.js - Natural Legal Language Logic Engine

async function parseTemplate() {
  const text = document.getElementById('templateText').value;
  const outputDiv = document.getElementById('astOutput');
  
  outputDiv.innerHTML = `<p style="color: #666; font-size: 0.9rem;">Analyzing clause structure...</p>`;

  try {
    const { data, error } = await supabase.functions.invoke('ast-parse', {
      body: { clauseId: 'active-clause', text }
    });
    if (error) throw error;

    const ast = data.ast;
    const rules = ast.extractedRules || { conditionalGovernance: false, dynamicVariablesPresent: false };

    outputDiv.innerHTML = `
      <div style="background: #F8FAFC; border: 1px solid #E2DBD0; padding: 1rem; border-radius: 8px;">
        <h4 style="margin: 0 0 0.5rem 0; font-size: 0.95rem; color: #1E293B;">📄 Clause Structural Summary</h4>
        <p style="margin: 4px 0; font-size: 0.88rem;"><b>Text Length:</b> ${ast.contentLength} characters</p>
        <p style="margin: 4px 0; font-size: 0.88rem;"><b>Conditional Governance:</b> ${rules.conditionalGovernance ? 'Detected (If/When conditions active)' : 'None'}</p>
        <p style="margin: 4px 0; font-size: 0.88rem;"><b>Dynamic Fields:</b> ${rules.dynamicVariablesPresent ? 'Present' : 'Standard Text'}</p>
        <p style="margin: 4px 0; font-size: 0.82rem; color: #64748B;">Successfully parsed at ${new Date(ast.parsedAt).toLocaleTimeString()}</p>
      </div>
    `;
  } catch (err) {
    outputDiv.innerHTML = `<div class="alert-box alert-fail" style="padding: 0.8rem; font-size: 0.88rem;">Error parsing clause: ${err.message}</div>`;
  }
}

async function runConflictCheck() {
  const idsInput = document.getElementById('clauseIdsInput').value;
  const ids = idsInput.split(',').map(s => s.trim()).filter(Boolean);
  const resultDiv = document.getElementById('validationResult');
  
  resultDiv.innerHTML = `<p style="color: #666; font-size: 0.9rem;">Auditing clauses for conflicts...</p>`;

  try {
    const { data, error } = await supabase.functions.invoke('ast-validate', {
      body: { clauseIds: ids, context: { isPhilippineJurisdiction: true } }
    });
    if (error) throw error;
    
    if (data.conflictReport.isValid) {
      resultDiv.innerHTML = `
        <div class="alert-box alert-pass" style="padding: 1rem; border-radius: 8px;">
          <strong>✅ Audit Passed: Zero Conflicts Found</strong>
          <p style="margin: 0.4rem 0 0 0; font-size: 0.88rem;">All selected clauses comply with active public policy rules. (Audit completed in ${data.conflictReport.metrics.evaluationTimeMs}ms)</p>
        </div>`;
    } else {
      let errs = data.conflictReport.violations.map(v => `<li style="margin-bottom: 4px;"><b>Legal Contradiction:</b> ${v.message}</li>`).join('');
      resultDiv.innerHTML = `
        <div class="alert-box alert-fail" style="padding: 1rem; border-radius: 8px;">
          <strong>⚠️ Compliance Warning: Conflicts Detected</strong>
          <ul style="margin: 0.5rem 0 0 1.2rem; padding: 0; font-size: 0.88rem;">${errs}</ul>
        </div>`;
    }
  } catch (err) {
    resultDiv.innerHTML = `<div class="alert-box alert-fail" style="padding: 0.8rem; font-size: 0.88rem;">Audit failed: ${err.message}</div>`;
  }
}

async function runDagBuild() {
  const inputText = document.getElementById('dagInputText').value;
  const resultDiv = document.getElementById('dagOutput');
  
  resultDiv.innerHTML = `<p style="color: #666; font-size: 0.9rem;">Verifying contract assembly blueprint...</p>`;

  try {
    const lines = inputText.split('\n');
    const clauses = [];
    
    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      
      const parts = line.split(':');
      const id = parts[0].trim();
      let dependencies = [];
      
      if (parts.length > 1) {
        dependencies = parts[1].split(',').map(d => d.trim()).filter(Boolean);
      }
      
      clauses.push({ id, dependencies });
    }

    const { data, error } = await supabase.functions.invoke('ast-dag', {
      body: { clauses }
    });
    if (error) throw error;

    const report = data.dagReport;

    if (report.isAcyclic) {
      let sequenceHtml = report.executionOrder.map((id, index) => 
        `<li style="margin-bottom: 4px;"><b>Step ${index + 1}:</b> Insert <i>"${id}"</i></li>`
      ).join('');

      resultDiv.innerHTML = `
        <div class="alert-box alert-pass" style="padding: 1rem; border-radius: 8px;">
          <strong>✅ Blueprint Verified: Clean Assembly Order</strong>
          <p style="margin: 0.5rem 0 0.3rem 0; font-size: 0.88rem;">Recommended Document Compilation Sequence:</p>
          <ul style="margin: 0 0 0.5rem 1.2rem; padding: 0; font-size: 0.88rem;">${sequenceHtml}</ul>
          <small style="color: #555;">Evaluated in ${report.metrics.evaluationTimeMs}ms</small>
        </div>
      `;
    } else {
      resultDiv.innerHTML = `
        <div class="alert-box alert-fail" style="padding: 1rem; border-radius: 8px;">
          <strong>⚠️ Structural Deadlock Detected</strong>
          <p style="margin: 0.4rem 0 0.2rem 0; font-size: 0.88rem;">The document outline contains circular logic or recursive dependencies. Document compilation is locked.</p>
          <p style="margin: 0; font-size: 0.85rem;"><b>Conflicting Clauses:</b> ${report.unresolvedNodes.join(', ')}</p>
        </div>
      `;
    }

  } catch (err) {
    resultDiv.innerHTML = `<div class="alert-box alert-fail" style="padding: 0.8rem; font-size: 0.88rem;">Error verifying blueprint: ${err.message}</div>`;
  }
}

async function runDraftAssembly() {
  const resultDiv = document.getElementById('compileOutput');
  resultDiv.innerHTML = `<p style="color: #666; font-size: 0.9rem;">Assembling contract and saving to client records...</p>`;

  try {
    const context = JSON.parse(document.getElementById('compileContextJson').value);
    
    // Cleaned clauses with proper variable formatting
    const clauses = [
      { 
        id: "Governing Law Clause", 
        dependencies: [], 
        text: "If Philippine jurisdiction applies, the laws of the Republic of the Philippines shall govern this agreement for {{clientName}}." 
      },
      { 
        id: "Confidentiality Clause", 
        dependencies: ["Governing Law Clause"], 
        text: "Both parties agree to maintain strict secrecy for a duration of {{confidentiality.years}} years." 
      }
    ];

    const { data, error } = await supabase.functions.invoke('ast-assemble', {
      body: { clauses, context, clientId: "client-acme-001" }
    });
    if (error) throw error;

    if (data.success) {
      resultDiv.innerHTML = `
        <div style="background: #F8FAFC; border: 1px solid #E2DBD0; padding: 1rem; border-radius: 8px;">
          <h4 style="margin: 0 0 0.5rem 0; font-size: 0.95rem; color: #10B981;">✅ Contract Compiled & Saved to Client Files</h4>
          <p style="margin: 4px 0 0.5rem 0; font-size: 0.85rem; color: #475569;"><b>Saved File:</b> ${data.fileName}</p>
          <pre style="white-space: pre-wrap; font-family: monospace; font-size: 0.82rem; background: #FFF; padding: 0.75rem; border: 1px solid #CBD5E1; border-radius: 6px; margin-top: 0.5rem;">${data.compiledContract}</pre>
          <small style="color: #64748B;">Processed & stored in ${data.metrics.executionTimeMs}ms</small>
        </div>
      `;
    } else {
      resultDiv.innerHTML = `<div class="alert-box alert-fail">Compilation failed: ${data.error}</div>`;
    }
  } catch (err) {
    resultDiv.innerHTML = `<div class="alert-box alert-fail">Error: ${err.message}</div>`;
  }
}