import type { Edge, Node } from '@xyflow/react';
import type {
  AgentDefinitionInput,
  Workflow,
} from '@/features/workspace-builder/schema';
import { autoLayout } from './autoLayout';

export interface AgentNodeData extends Record<string, unknown> {
  name: string;
  description: string;
  slug: string;
}

export interface AgentEdgeData extends Record<string, unknown> {
  condition: string | null;
}

export type AgentFlowNode = Node<AgentNodeData, 'agent'>;
export type AgentFlowEdge = Edge<AgentEdgeData>;

export function toReactFlow(
  workflow: Workflow,
  agents: AgentDefinitionInput[],
): { nodes: AgentFlowNode[]; edges: AgentFlowEdge[] } {
  const positionBySlug = new Map(workflow.nodes.map((n) => [n.id, n.position]));
  const nodes: AgentFlowNode[] = agents
    .filter((a) => a.slug)
    .map((a, i) => ({
      id: a.slug,
      type: 'agent',
      position: positionBySlug.get(a.slug) ?? autoLayout(i),
      data: { name: a.name || a.slug, description: a.description, slug: a.slug, label: a.name || a.slug },
    }));
  const edges: AgentFlowEdge[] = workflow.edges.map((e) => ({
    id: e.id,
    type: 'handoff',
    source: e.source,
    target: e.target,
    label: e.label ?? undefined,
    data: { condition: e.condition ?? null },
  }));
  return { nodes, edges };
}
