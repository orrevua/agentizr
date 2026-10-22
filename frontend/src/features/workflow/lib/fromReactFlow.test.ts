import { describe, expect, it } from 'vitest';
import {
  addConnectionToWorkflow,
  applyNodeChangesToWorkflow,
  updateEdgeCondition,
} from './fromReactFlow';
import type { Workflow } from '@/features/workspace-builder/schema';
import { makeEmptyAgent } from '@/features/workspace-builder/defaults';

const agents = [
  { ...makeEmptyAgent(), name: 'A', slug: 'a' },
  { ...makeEmptyAgent(), name: 'B', slug: 'b' },
];

const baseWorkflow: Workflow = {
  nodes: [
    { id: 'a', position: { x: 0, y: 0 } },
    { id: 'b', position: { x: 100, y: 0 } },
  ],
  edges: [],
};

describe('addConnectionToWorkflow', () => {
  it('adds an edge with generated id', () => {
    const next = addConnectionToWorkflow(
      { source: 'a', target: 'b', sourceHandle: null, targetHandle: null },
      baseWorkflow,
    );
    expect(next.edges).toHaveLength(1);
    expect(next.edges[0]).toMatchObject({ source: 'a', target: 'b', condition: null });
    expect(next.edges[0].id).toBeTruthy();
  });

  it('ignores connection without source or target', () => {
    const next = addConnectionToWorkflow(
      { source: '', target: 'b', sourceHandle: null, targetHandle: null },
      baseWorkflow,
    );
    expect(next).toBe(baseWorkflow);
  });
});

describe('applyNodeChangesToWorkflow', () => {
  it('updates node position from a position change', () => {
    const next = applyNodeChangesToWorkflow(
      [
        {
          id: 'a',
          type: 'position',
          position: { x: 50, y: 50 },
          dragging: false,
        },
      ],
      baseWorkflow,
      agents,
    );
    const node = next.nodes.find((n) => n.id === 'a');
    expect(node?.position).toEqual({ x: 50, y: 50 });
  });
});

describe('updateEdgeCondition', () => {
  it('sets condition and mirrors to label', () => {
    const wf: Workflow = {
      ...baseWorkflow,
      edges: [{ id: 'e1', source: 'a', target: 'b', label: null, condition: null }],
    };
    const next = updateEdgeCondition(wf, 'e1', 'Task complete');
    expect(next.edges[0].condition).toBe('Task complete');
    expect(next.edges[0].label).toBe('Task complete');
  });
});
