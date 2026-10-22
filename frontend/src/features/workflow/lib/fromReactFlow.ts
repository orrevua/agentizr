import {
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from '@xyflow/react';
import type { Workflow } from '@/features/workspace-builder/schema';
import {
  toReactFlow,
  type AgentFlowEdge,
  type AgentFlowNode,
} from './toReactFlow';
import type { AgentDefinitionInput } from '@/features/workspace-builder/schema';

function makeEdgeId(): string {
  return `e_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function nodesToWorkflow(
  prev: Workflow,
  nextRfNodes: AgentFlowNode[],
): Workflow['nodes'] {
  const positionBySlug = new Map(nextRfNodes.map((n) => [n.id, n.position]));
  const seen = new Set<string>();
  const nodes = prev.nodes
    .filter((n) => {
      if (!positionBySlug.has(n.id)) return false;
      seen.add(n.id);
      return true;
    })
    .map((n) => ({ ...n, position: positionBySlug.get(n.id)! }));
  for (const rfNode of nextRfNodes) {
    if (!seen.has(rfNode.id)) {
      nodes.push({ id: rfNode.id, position: rfNode.position });
    }
  }
  return nodes;
}

function edgesToWorkflow(nextRfEdges: AgentFlowEdge[]): Workflow['edges'] {
  return nextRfEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: typeof e.label === 'string' ? e.label : null,
    condition: (e.data?.condition as string | null | undefined) ?? null,
  }));
}

export function applyNodeChangesToWorkflow(
  changes: NodeChange<AgentFlowNode>[],
  workflow: Workflow,
  agents: AgentDefinitionInput[],
): Workflow {
  const { nodes } = toReactFlow(workflow, agents);
  const next = applyNodeChanges(changes, nodes);
  return { ...workflow, nodes: nodesToWorkflow(workflow, next) };
}

export function applyEdgeChangesToWorkflow(
  changes: EdgeChange<AgentFlowEdge>[],
  workflow: Workflow,
  agents: AgentDefinitionInput[],
): Workflow {
  const { edges } = toReactFlow(workflow, agents);
  const next = applyEdgeChanges(changes, edges);
  return { ...workflow, edges: edgesToWorkflow(next) };
}

export function addConnectionToWorkflow(
  connection: Connection,
  workflow: Workflow,
): Workflow {
  if (!connection.source || !connection.target) {
    return workflow;
  }
  const id = makeEdgeId();
  const newEdge = {
    id,
    source: connection.source,
    target: connection.target,
    label: null,
    condition: null,
  };
  return {
    ...workflow,
    edges: [...workflow.edges, newEdge],
  };
}

export function updateEdgeCondition(
  workflow: Workflow,
  edgeId: string,
  condition: string,
): Workflow {
  return {
    ...workflow,
    edges: workflow.edges.map((e) =>
      e.id === edgeId ? { ...e, condition, label: condition } : e,
    ),
  };
}
