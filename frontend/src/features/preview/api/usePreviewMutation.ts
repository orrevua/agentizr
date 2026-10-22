'use client';

import { useMutation } from '@tanstack/react-query';
import { api } from '@/shared/lib/api-client';
import type { WorkspaceDefinitionInput } from '@/features/workspace-builder/schema';
import type { GenerationResult } from '../types';

export function usePreviewMutation() {
  return useMutation({
    mutationFn: (def: WorkspaceDefinitionInput) =>
      api<GenerationResult>('/preview', { method: 'POST', body: JSON.stringify(def) }),
  });
}
