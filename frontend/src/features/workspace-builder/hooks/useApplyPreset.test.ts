import { describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { useApplyPreset } from './useApplyPreset';
import { makeEmptyWorkspace } from '../defaults';
import type { WorkspaceDefinitionInput } from '../schema';
import type { CatalogPresetItem } from '../types';

const PRESET: CatalogPresetItem = {
  id: 'security-auditor',
  label: 'Security Auditor',
  description: 'desc',
  definition: {
    tools: ['Read', 'Grep'],
    activationMode: 'on_demand',
    instructions: 'You are a security auditor. Scan for OWASP.',
  },
};

describe('useApplyPreset', () => {
  it('merges preset definition over defaults at the active agent index', () => {
    const { result } = renderHook(() => {
      const form = useForm<WorkspaceDefinitionInput>({ defaultValues: makeEmptyWorkspace() });
      const apply = useApplyPreset(form, 0);
      return { form, apply };
    });

    act(() => result.current.apply(PRESET));

    const agent = result.current.form.getValues('agents.0');
    expect(agent.tools).toEqual(['Read', 'Grep']);
    expect(agent.activationMode).toBe('on_demand');
    expect(agent.instructions).toContain('OWASP');
    expect(agent.targetPlatforms).toEqual(['claude-code']);
  });
});
