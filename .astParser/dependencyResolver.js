// dependencyResolver.ts
import { ASTNode } from './astParser';

export class DependencyResolver {
  private registry: Map<string, ASTNode> = new Map();

  public registerClause(node: ASTNode): void {
    this.registry.set(node.id, node);
  }

  /**
   * Resolves execution order and required prerequisite clauses using topological sorting.
   */
  public resolveDependencies(requestedClauseIds: string[], questionnaireInputs: Record<string, any>): {
    executionQueue: string[];
    missingPrerequisites: string[];
  } {
    const visited = new Set<string>();
    const tempMark = new Set<string>();
    const executionQueue: string[] = [];
    const missingPrerequisites: string[] = [];

    const visit = (id: string) => {
      if (tempMark.has(id)) {
        throw new Error(`Circular dependency detected involving clause: ${id}`);
      }
      if (!visited.has(id)) {
        tempMark.add(id);
        const node = this.registry.get(id);

        if (!node) {
          missingPrerequisites.push(id);
          tempMark.delete(id);
          return;
        }

        // Check explicit dependencies
        if (node.dependencies) {
          for (const depId of node.dependencies) {
            visit(depId);
          }
        }

        // Check conditional variable requirements
        if (node.variables) {
          for (const v of node.variables) {
            if (questionnaireInputs[v] === undefined) {
              // Variable missing from inputs, flag if mandatory
            }
          }
        }

        tempMark.delete(id);
        visited.add(id);
        executionQueue.push(id);
      }
    };

    for (const id of requestedClauseIds) {
      visit(id);
    }

    return { executionQueue, missingPrerequisites };
  }
}