'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { AgentFlowNode } from '../lib/toReactFlow';

export function AgentNode({ data }: NodeProps<AgentFlowNode>) {
  return (
    <div className="min-w-[180px] max-w-[220px] rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 shadow-sm">
      <Handle
        id="target"
        type="target"
        position={Position.Left}
        isConnectable
        className="!h-3 !w-3 !border-2 !border-[var(--color-card)] !bg-[var(--color-foreground)]"
      />
      <div className="truncate text-sm font-semibold text-[var(--color-foreground)]">
        {data.name}
      </div>
      {data.description && (
        <div className="truncate text-xs text-[var(--color-muted-foreground)]">
          {data.description}
        </div>
      )}
      <div className="mt-1 truncate font-mono text-[10px] text-[var(--color-muted-foreground)]">
        @{data.slug}
      </div>
      <Handle
        id="source"
        type="source"
        position={Position.Right}
        isConnectable
        className="!h-3 !w-3 !border-2 !border-[var(--color-card)] !bg-[var(--color-foreground)]"
      />
    </div>
  );
}
