import { describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { useAgentTabsController } from './useAgentTabsController';
import { makeEmptyWorkspace } from '../defaults';
import type { WorkspaceDefinitionInput } from '../schema';

function setup() {
  return renderHook(() => {
    const form = useForm<WorkspaceDefinitionInput>({ defaultValues: makeEmptyWorkspace() });
    const tabs = useAgentTabsController(form);
    return { form, tabs };
  });
}

describe('useAgentTabsController', () => {
  it('starts with a single agent', () => {
    const { result } = setup();
    expect(result.current.tabs.fields).toHaveLength(1);
    expect(result.current.tabs.canRemove).toBe(false);
  });

  it('add() appends a new agent and focuses the new tab', () => {
    const { result } = setup();
    act(() => result.current.tabs.add());
    expect(result.current.tabs.fields).toHaveLength(2);
    expect(result.current.tabs.activeIndex).toBe(1);
  });

  it('rename() syncs slug into workflow nodes when slug becomes known', () => {
    const { result } = setup();
    act(() => result.current.tabs.add());
    act(() => result.current.tabs.rename(1, 'Reviewer'));
    const workflow = result.current.form.getValues('workflow');
    expect(workflow.nodes.map((n) => n.id)).toContain('reviewer');
  });

  it('remove() drops the agent and any matching workflow node + edges', () => {
    const { result } = setup();
    act(() => result.current.tabs.add());
    act(() => result.current.tabs.rename(0, 'Alpha'));
    act(() => result.current.tabs.rename(1, 'Beta'));
    act(() =>
      result.current.form.setValue('workflow.edges', [
        { id: 'e1', source: 'alpha', target: 'beta', label: null, condition: null },
      ]),
    );
    act(() => result.current.tabs.remove(1));
    const workflow = result.current.form.getValues('workflow');
    expect(workflow.nodes.find((n) => n.id === 'beta')).toBeUndefined();
    expect(workflow.edges).toHaveLength(0);
  });
});
