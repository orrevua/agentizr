'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { workspaceSchema, type WorkspaceDefinitionInput } from '../schema';
import { makeEmptyWorkspace } from '../defaults';

export function useWorkspaceForm(defaults?: Partial<WorkspaceDefinitionInput>) {
  return useForm<WorkspaceDefinitionInput>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: { ...makeEmptyWorkspace(), ...defaults },
    mode: 'onBlur',
  });
}
