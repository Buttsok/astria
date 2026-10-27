// dependencyResolver.js
class DependencyResolver {
  constructor() {
    this.registry = new Map();
  }

  registerClause(node) {
    this.registry.set(node.id, node);
  }

  resolveDependencies(requestedClauseIds, questionnaireInputs) {
    const visited = new Set();
    const tempMark = new Set();
    const executionQueue = [];
    const missingPrerequisites = [];

    const visit = (id) => {
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

        if (node.dependencies) {
          for (const depId of node.dependencies) {
            visit(depId);
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

module.exports = { DependencyResolver };