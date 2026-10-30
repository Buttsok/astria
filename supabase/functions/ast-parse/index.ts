import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const text = body.text || "";

    const startTime = performance.now();

    // Detect natural language conditions & variables
    const hasConditions = text.toLowerCase().includes("if") || text.toLowerCase().includes("when");
    const hasVariables = text.includes("{") || text.includes("}");

    const ast = {
      type: "NaturalLanguageLegalClause",
      clauseId: body.clauseId || "active-clause",
      contentLength: text.length,
      parsedContent: text,
      extractedRules: {
        conditionalGovernance: hasConditions,
        dynamicVariablesPresent: hasVariables
      },
      parsedAt: new Date().toISOString()
    };

    const endTime = performance.now();

    return new Response(
      JSON.stringify({ ast, metrics: { executionTimeMs: Math.round(endTime - startTime) } }),
      { headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' } },
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' } },
    );
  }
});