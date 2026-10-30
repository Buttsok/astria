import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { 
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' 
      } 
    });
  }

  try {
    const body = await req.json();
    const clauses = body.clauses || []; 
    const context = body.context || {}; 
    const clientId = body.clientId || 'client-acme-001';
    const clientType = body.clientType || (context.clientName ? 'company' : 'individual');

    const startTime = performance.now();

    // 1. Topological Sorting (Kahn's Algorithm)
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    const clauseMap = new Map<string, any>();

    clauses.forEach((c: any) => {
      clauseMap.set(c.id, c);
      if (!graph.has(c.id)) graph.set(c.id, []);
      if (!inDegree.has(c.id)) inDegree.set(c.id, 0);
      
      (c.dependencies || []).forEach((dep: string) => {
        if (!graph.has(dep)) graph.set(dep, []);
        graph.get(dep)!.push(c.id);
        inDegree.set(c.id, (inDegree.get(c.id) || 0) + 1);
      });
    });

    const queue: string[] = [];
    inDegree.forEach((degree, id) => {
      if (degree === 0) queue.push(id);
    });

    const executionOrder: string[] = [];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      executionOrder.push(curr);
      (graph.get(curr) || []).forEach((neighbor) => {
        inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
        if (inDegree.get(neighbor) === 0) queue.push(neighbor);
      });
    }

    if (executionOrder.length !== clauseMap.size) {
      throw new Error("Compilation halted: Circular dependency deadlock detected in clause blueprint.");
    }

    // 2. Compile Contract Text
    let compiledContract = "";

    for (const id of executionOrder) {
      const clause = clauseMap.get(id);
      let text = clause.text || "";

      text = text.replace(/#IF\s*\(([^)]+)\)\s*\{([^}]+)\}/g, (_match: string, condition: string, innerText: string) => {
        const trimmedCond = condition.trim();
        const isTrue = context[trimmedCond] === true;
        return isTrue ? innerText.trim() : "";
      });

      text = text.replace(/\{\{([^}]+)\}\}/g, (_match: string, path: string) => {
        const keys = path.trim().split('.');
        let val: any = context;
        for (const key of keys) {
          val = val ? val[key] : undefined;
        }
        return val !== undefined ? val : `[MISSING: ${path}]`;
      });

      compiledContract += `\n\n[SECTION: ${id}]\n` + text.trim();
    }

    compiledContract = compiledContract.trim();
    const clientName = context.clientName || context.firstName || 'Client';
    const fileName = `Master_Agreement_${clientName}_${Date.now()}.docx`;

    // 3. Save to Supabase Database Table (`client_files`)
    let savedSuccessfully = false;
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);

        await supabase.from('client_files').insert([
          { 
            client_id: clientId, 
            client_type: clientType, // 'individual' or 'company'
            file_name: fileName, 
            file_content: compiledContract,
            status: 'Compiled & Ready' 
          }
        ]);
        savedSuccessfully = true;
      }
    } catch (syncErr) {
      console.error("Background sync notice:", syncErr);
    }

    const endTime = performance.now();

    return new Response(
      JSON.stringify({ 
        success: true, 
        compiledContract,
        fileName,
        savedSuccessfully,
        metrics: { evaluationTimeMs: Math.round(endTime - startTime) }
      }),
      { headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' } },
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' } },
    );
  }
});