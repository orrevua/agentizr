'use client';

import { useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
import { useTranslations } from 'next-intl';
import { Input } from '@/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { useHandoffConditions } from '../hooks/useHandoffConditions';
import type { AgentFlowEdge } from '../lib/toReactFlow';
import { useEdgeCallbacks } from './EdgeCallbacks';

export function HandoffEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  style,
}: EdgeProps<AgentFlowEdge>) {
  const { onConditionChange, readOnly } = useEdgeCallbacks();
  const t = useTranslations('workflow');
  const { data: conditions } = useHandoffConditions();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const label = data?.condition ?? '';

  const choose = (value: string) => {
    onConditionChange(id, value);
    setOpen(false);
    setDraft('');
  };

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: 'var(--color-foreground)',
          strokeWidth: 2,
        }}
      />
      <EdgeLabelRenderer>
        <div
          className="absolute pointer-events-auto"
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
        >
          {readOnly ? (
            <span className="rounded bg-[var(--color-card)] px-2 py-0.5 text-xs">
              {label || t('edgeCondition.placeholder')}
            </span>
          ) : (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="cursor-pointer rounded border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-0.5 text-xs hover:bg-[var(--color-accent)]"
                >
                  {label || t('edgeCondition.placeholder')}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 space-y-2 p-2" align="center">
                <Input
                  placeholder={t('edgeCondition.custom')}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && draft.trim()) {
                      e.preventDefault();
                      choose(draft.trim());
                    }
                  }}
                />
                <ul className="max-h-48 space-y-0.5 overflow-y-auto">
                  {conditions.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => choose(c.label)}
                        className="w-full cursor-pointer rounded px-2 py-1 text-left text-sm hover:bg-[var(--color-accent)]"
                      >
                        {c.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
