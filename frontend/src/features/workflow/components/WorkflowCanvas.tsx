'use client';

import { useCallback, useEffect, useRef, useMemo } from 'react';
import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type EdgeChange,
  type EdgeTypes,
  type NodeChange,
  type NodeTypes,
} from '@xyflow/react';
import type {
  AgentDefinitionInput,
  Workflow,
} from '@/features/workspace-builder/schema';
import { AgentNode } from './AgentNode';
import { EdgeCallbacksProvider } from './EdgeCallbacks';
import { HandoffEdge } from './HandoffEdge';
import {
  addConnectionToWorkflow,
  applyEdgeChangesToWorkflow,
  applyNodeChangesToWorkflow,
  updateEdgeCondition,
} from '../lib/fromReactFlow';
import { toReactFlow, type AgentFlowEdge, type AgentFlowNode } from '../lib/toReactFlow';

const NODE_TYPES: NodeTypes = { agent: AgentNode };
const EDGE_TYPES: EdgeTypes = { handoff: HandoffEdge };
const FLOW_STROKE = 'var(--color-foreground)';

function FitOnChange({ nodeCount }: { nodeCount: number }) {
  const rf = useReactFlow();
  useEffect(() => {
    if (nodeCount > 0) {
      const id = window.setTimeout(() => rf.fitView({ padding: 0.2, duration: 150 }), 0);
      return () => window.clearTimeout(id);
    }
  }, [nodeCount, rf]);
  return null;
}

interface Props {
  value: Workflow;
  agents: AgentDefinitionInput[];
  onChange: (next: Workflow) => void;
  readOnly?: boolean;
}

export function WorkflowCanvas({ value, agents, onChange, readOnly = false }: Props) {
  const initial = toReactFlow(value, agents);
  const [nodes, setNodes, applyNodesChange] = useNodesState<AgentFlowNode>(initial.nodes);
  const [edges, setEdges, applyEdgesChange] = useEdgesState<AgentFlowEdge>(initial.edges);

  // Track whether a change originated from within the canvas to prevent feedback loops
  const internalChange = useRef(false);

  // Stable fingerprint: only re-sync from form when structural data changes
  const agentSlugs = useMemo(
    () => agents.filter((a) => a.slug).map((a) => `${a.slug}|${a.name}|${a.description}`).join(','),
    [agents],
  );
  const edgeFingerprint = useMemo(
    () => value.edges.map((e) => `${e.id}:${e.source}->${e.target}:${e.condition}`).join(','),
    [value.edges],
  );

  useEffect(() => {
    if (internalChange.current) {
      internalChange.current = false;
      return;
    }
    const next = toReactFlow(value, agents);
    setNodes(next.nodes);
    setEdges(next.edges);
  }, [agentSlugs, edgeFingerprint, setEdges, setNodes]); // eslint-disable-line react-hooks/exhaustive-deps

  const onNodesChange = useCallback(
    (changes: NodeChange<AgentFlowNode>[]) => {
      applyNodesChange(changes);
      // Only propagate position changes (from user drag) to the form.
      // Dimension/select changes are React Flow internal bookkeeping.
      const positionChanges = changes.filter(
        (c): c is NodeChange<AgentFlowNode> & { type: 'position' } =>
          c.type === 'position' && 'dragging' in c && c.dragging === false,
      );
      if (positionChanges.length > 0) {
        internalChange.current = true;
        onChange(applyNodeChangesToWorkflow(positionChanges, value, agents));
      }
    },
    [agents, applyNodesChange, onChange, value],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<AgentFlowEdge>[]) => {
      applyEdgesChange(changes);
      // Only propagate removals to the form
      const removals = changes.filter((c) => c.type === 'remove');
      if (removals.length > 0) {
        internalChange.current = true;
        onChange(applyEdgeChangesToWorkflow(removals, value, agents));
      }
    },
    [agents, applyEdgesChange, onChange, value],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const nextWorkflow = addConnectionToWorkflow(connection, value);
      const nextEdge = toReactFlow(nextWorkflow, agents).edges.at(-1);
      if (nextEdge) setEdges((current) => addEdge(nextEdge, current));
      internalChange.current = true;
      onChange(nextWorkflow);
    },
    [agents, onChange, setEdges, value],
  );

  const onConditionChange = useCallback(
    (edgeId: string, condition: string) => {
      setEdges((current) =>
        current.map((e) =>
          e.id === edgeId
            ? { ...e, label: condition, data: { ...e.data, condition } }
            : e,
        ),
      );
      internalChange.current = true;
      onChange(updateEdgeCondition(value, edgeId, condition));
    },
    [onChange, setEdges, value],
  );

  return (
    <EdgeCallbacksProvider value={{ onConditionChange, readOnly }}>
      <ReactFlowProvider>
        <div
          style={{ width: '100%', height: 480, position: 'relative' }}
          className="overflow-hidden rounded-md border border-[var(--color-border)]"
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={NODE_TYPES}
            edgeTypes={EDGE_TYPES}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodesDraggable={!readOnly}
            nodesConnectable={!readOnly}
            elementsSelectable={!readOnly}
            edgesReconnectable={!readOnly}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            connectionLineStyle={{ stroke: FLOW_STROKE, strokeWidth: 2 }}
            defaultEdgeOptions={{
              type: 'handoff',
              style: { stroke: FLOW_STROKE, strokeWidth: 2 },
            }}
            proOptions={{ hideAttribution: true }}
            style={{ width: '100%', height: '100%' }}
          >
            <Background />
            <Controls showInteractive={false} />
            <FitOnChange nodeCount={nodes.length} />
          </ReactFlow>
        </div>
      </ReactFlowProvider>
    </EdgeCallbacksProvider>
  );
}
