'use client';

import { useCallback } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { AgentDefinitionInput, WorkspaceDefinitionInput } from '../schema';
import type { CatalogPresetItem } from '../types';
import { makeEmptyAgent } from '../defaults';

export function useApplyPreset(
  form: UseFormReturn<WorkspaceDefinitionInput>,
  activeIndex: number,
) {
  return useCallback(
    (preset: CatalogPresetItem) => {
      const merged: AgentDefinitionInput = {
        ...makeEmptyAgent(),
        name: preset.label,
        description: preset.description,
        ...(preset.definition as Partial<AgentDefinitionInput>),
      };
      form.setValue(`agents.${activeIndex}`, merged, { shouldValidate: true });
    },
    [form, activeIndex],
  );
}
