'use client';

import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import type { WorkspaceDefinitionInput } from '@/features/workspace-builder/schema';
import { EmptyState } from './EmptyState';
import { MobileNotice } from './MobileNotice';
import { WorkflowCanvas } from './WorkflowCanvas';

interface Props {
  onAddAgent: () => void;
  canAdd: boolean;
}

export function WorkflowController({ onAddAgent, canAdd }: Props) {
  const t = useTranslations('workflow');
  const { control } = useFormContext<WorkspaceDefinitionInput>();
  const agents = useWatch({ control, name: 'agents' });
  const isMobile = useMediaQuery('(max-width: 768px)');

  const definedAgents = (agents ?? []).filter((a) => a?.slug);

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {t('title')}
      </h2>
      {isMobile && <MobileNotice />}
      {definedAgents.length < 2 ? (
        <EmptyState onAddAgent={onAddAgent} canAdd={canAdd} />
      ) : (
        <Controller
          control={control}
          name="workflow"
          render={({ field }) => (
            <WorkflowCanvas
              value={field.value}
              agents={agents}
              onChange={field.onChange}
              readOnly={isMobile}
            />
          )}
        />
      )}
    </section>
  );
}
