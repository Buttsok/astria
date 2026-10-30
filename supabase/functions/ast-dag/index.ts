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
    const clauses = body.clauses || []; // Format: [{ id: "c1", dependencies: ["c2"] }]

    const startTime = performance.now();
    
    // Build adjacency list & in-degree map for DAG resolution
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    
    clauses.forEach((c: any) => {
      if (!graph.has(c.id)) graph.set(c.id, []);
      if (!inDegree.has(c.id)) inDegree.set(c.id, 0);
      
      (c.dependencies || []).forEach((dep: string) => {
        if (!graph.has(dep)) graph.set(dep, []);
        graph.get(dep)!.push(c.id);
        inDegree.set(c.id, (inDegree.get(c.id) || 0) + 1);
      });
    });

    // Kahn's algorithm for topological sort & circular reference detection
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
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      });
    }

    const isAcyclic = executionOrder.length === inDegree.size;
    const endTime = performance.now();

    const dagReport = {
      isAcyclic,
      executionOrder: isAcyclic ? executionOrder : [],
      unresolvedNodes: isAcyclic ? [] : Array.from(inDegree.entries()).filter(([_, deg]) => deg > 0).map(([id]) => id),
      metrics: {
        evaluationTimeMs: Math.round(endTime - startTime)
      }
    };

    return new Response(
      JSON.stringify({ dagReport }),
      { headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' } },
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' } },
    );
  }
});