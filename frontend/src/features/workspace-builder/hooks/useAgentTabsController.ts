'use client';

import { useCallback, useState } from 'react';
import { useFieldArray, type UseFormReturn } from 'react-hook-form';
import { autoLayout } from '@/features/workflow/lib/autoLayout';
import { slugify, type WorkspaceDefinitionInput } from '../schema';
import { makeEmptyAgent } from '../defaults';

export const MAX_AGENTS = 10;

export function useAgentTabsController(form: UseFormReturn<WorkspaceDefinitionInput>) {
  const fieldArray = useFieldArray({ control: form.control, name: 'agents' });
  const [activeIndex, setActiveIndex] = useState(0);

  const add = useCallback(() => {
    if (fieldArray.fields.length >= MAX_AGENTS) return;
    const nextIndex = fieldArray.fields.length;
    fieldArray.append(makeEmptyAgent());
    setActiveIndex(nextIndex);
  }, [fieldArray]);

  const remove = useCallback(
    (index: number) => {
      if (fieldArray.fields.length <= 1) return;
      const removedSlug = form.getValues(`agents.${index}.slug`);
      fieldArray.remove(index);

      if (removedSlug) {
        const workflow = form.getValues('workflow');
        form.setValue(
          'workflow.nodes',
          workflow.nodes.filter((n) => n.id !== removedSlug),
        );
        form.setValue(
          'workflow.edges',
          workflow.edges.filter((e) => e.source !== removedSlug && e.target !== removedSlug),
        );
      }

      setActiveIndex((curr) => {
        if (curr === index) return Math.max(0, index - 1);
        if (curr > index) return curr - 1;
        return curr;
      });
    },
    [fieldArray, form],
  );

  const rename = useCallback(
    (index: number, name: string) => {
      form.setValue(`agents.${index}.name`, name, { shouldValidate: true });
      const nextSlug = slugify(name);
      const prevSlug = form.getValues(`agents.${index}.slug`);
      if (nextSlug !== prevSlug) {
        form.setValue(`agents.${index}.slug`, nextSlug, { shouldValidate: Boolean(nextSlug) });
      }
      if (nextSlug && nextSlug !== prevSlug) {
        const workflow = form.getValues('workflow');
        const nodeExists = workflow.nodes.some((n) => n.id === nextSlug);
        if (!nodeExists) {
          const existing = workflow.nodes.find((n) => n.id === prevSlug);
          if (existing) {
            form.setValue(
              'workflow.nodes',
              workflow.nodes.map((n) => (n.id === prevSlug ? { ...n, id: nextSlug } : n)),
            );
          } else {
            form.setValue('workflow.nodes', [
              ...workflow.nodes,
              { id: nextSlug, position: autoLayout(index) },
            ]);
          }
        }
      }
    },
    [form],
  );

  return {
    fields: fieldArray.fields,
    add,
    remove,
    rename,
    activeIndex,
    setActiveIndex,
    canAdd: fieldArray.fields.length < MAX_AGENTS,
    canRemove: fieldArray.fields.length > 1,
  };
}
