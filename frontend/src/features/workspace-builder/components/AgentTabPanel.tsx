'use client';

import { useWatch, type Control } from 'react-hook-form';
import { ActivationField, FIELD_VISIBILITY } from './ActivationField';
import { GlobsField } from './GlobsField';
import { IdentityFields } from './IdentityFields';
import { InstructionsField } from './InstructionsField';
import { McpServersField } from './McpServersField';
import { MemoryField } from './MemoryField';
import { ModelField } from './ModelField';
import { ToolsField } from './ToolsField';
import type { WorkspaceDefinitionInput } from '../schema';

interface Props {
  control: Control<WorkspaceDefinitionInput>;
  index: number;
}

export function AgentTabPanel({ control, index }: Props) {
  const basePath = `agents.${index}` as const;
  const activationMode =
    useWatch({ control, name: `${basePath}.activationMode` as const }) ?? 'auto';
  const showGlobs = FIELD_VISIBILITY[activationMode].globs;

  return (
    <div className="space-y-5">
      <IdentityFields control={control} basePath={basePath} />
      <InstructionsField control={control} basePath={basePath} />

      <div className="grid gap-4 md:grid-cols-2">
        <ToolsField control={control} basePath={basePath} />
        <McpServersField control={control} basePath={basePath} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ActivationField control={control} basePath={basePath} />
        <ModelField control={control} basePath={basePath} />
        <MemoryField control={control} basePath={basePath} />
      </div>

      {showGlobs && <GlobsField control={control} basePath={basePath} />}
    </div>
  );
}
