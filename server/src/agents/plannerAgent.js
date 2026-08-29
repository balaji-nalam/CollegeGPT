const logger = require('../utils/logger');

class PlannerAgent {
  constructor() {
    this.name = 'planner';
  }

  plan(workflow) {
    const { nodes = [], edges = [] } = workflow;

    if (nodes.length === 0) {
      return {
        success: false,
        error: 'Workflow contains no nodes to plan.',
        confidenceScore: 0.0,
        plan: [],
      };
    }

    // 1. Build adjacency list and in-degree tracking for DAG
    const adj = new Map();
    const inDegree = new Map();

    nodes.forEach((n) => {
      adj.set(n.id, []);
      inDegree.set(n.id, 0);
    });

    edges.forEach((e) => {
      if (adj.has(e.source) && inDegree.has(e.target)) {
        adj.get(e.source).push(e.target);
        inDegree.set(e.target, inDegree.get(e.target) + 1);
      }
    });

    // 2. Kahn's Algorithm for Topological Sort
    const queue = [];
    inDegree.forEach((deg, nodeId) => {
      if (deg === 0) {
        queue.push(nodeId);
      }
    });

    const orderedNodeIds = [];
    while (queue.length > 0) {
      const current = queue.shift();
      orderedNodeIds.push(current);

      const neighbors = adj.get(current) || [];
      neighbors.forEach((next) => {
        inDegree.set(next, inDegree.get(next) - 1);
        if (inDegree.get(next) === 0) {
          queue.push(next);
        }
      });
    }

    // Check for cycles
    const hasCycle = orderedNodeIds.length !== nodes.length;
    if (hasCycle) {
      return {
        success: false,
        error: 'Cyclic dependency or unresolvable loop detected in workflow graph.',
        confidenceScore: 0.2,
        plan: [],
      };
    }

    // Map back to node objects
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const plannedSteps = orderedNodeIds.map((id, index) => {
      const node = nodeMap.get(id);
      return {
        stepIndex: index + 1,
        nodeId: node.id,
        nodeType: node.type,
        label: node.data?.label || node.id,
        provider: node.data?.provider || null,
        action: node.data?.action || null,
        config: node.data || {},
      };
    });

    // 3. Compute Confidence Score based on parameter completeness
    let configuredNodesCount = 0;
    nodes.forEach((n) => {
      if (n.type === 'triggerNode' && n.data?.triggerType) configuredNodesCount++;
      else if (n.type === 'actionNode' && n.data?.provider && n.data?.action) configuredNodesCount++;
      else if (n.type === 'aiNode' && n.data?.prompt) configuredNodesCount++;
      else if (n.type === 'conditionNode' && n.data?.condition) configuredNodesCount++;
      else configuredNodesCount += 0.5;
    });

    const confidenceScore = Math.min(1.0, parseFloat((configuredNodesCount / nodes.length).toFixed(2)));

    logger.agent(this.name, null, `Computed execution plan with ${plannedSteps.length} steps. Confidence: ${confidenceScore}`);

    return {
      success: true,
      confidenceScore,
      stepsCount: plannedSteps.length,
      plan: plannedSteps,
    };
  }
}

module.exports = new PlannerAgent();
