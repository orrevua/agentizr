'use client';

import { useEffect, useRef } from 'react';
import { useWatch, type UseFormReturn } from 'react-hook-form';
import { autoLayout } from '@/features/workflow/lib/autoLayout';
import { slugify, type WorkspaceDefinitionInput } from '../schema';

export function useSlugFromName(form: UseFormReturn<WorkspaceDefinitionInput>) {
  const agents = useWatch({ control: form.control, name: 'agents' });
  const prevSlugsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!Array.isArray(agents)) return;
    const prevSlugs = prevSlugsRef.current;
    const nextSlugs: string[] = [];

    agents.forEach((agent, i) => {
      const derived = slugify(agent?.name ?? '');
      nextSlugs[i] = derived;
      if (derived !== agent?.slug) {
        form.setValue(`agents.${i}.slug`, derived, { shouldValidate: Boolean(derived) });
      }
    });

    const workflow = form.getValues('workflow');
    let nodesChanged = false;
    let edgesChanged = false;
    const nextNodes = workflow.nodes.map((n) => {
      const oldIdx = prevSlugs.indexOf(n.id);
      if (oldIdx !== -1 && nextSlugs[oldIdx] && nextSlugs[oldIdx] !== n.id) {
        nodesChanged = true;
        return { ...n, id: nextSlugs[oldIdx] };
      }
      return n;
    });
    const nextEdges = workflow.edges.map((e) => {
      let src = e.source;
      let tgt = e.target;
      const srcIdx = prevSlugs.indexOf(src);
      const tgtIdx = prevSlugs.indexOf(tgt);
      if (srcIdx !== -1 && nextSlugs[srcIdx] && nextSlugs[srcIdx] !== src) {
        src = nextSlugs[srcIdx];
        edgesChanged = true;
      }
      if (tgtIdx !== -1 && nextSlugs[tgtIdx] && nextSlugs[tgtIdx] !== tgt) {
        tgt = nextSlugs[tgtIdx];
        edgesChanged = true;
      }
      return src === e.source && tgt === e.target ? e : { ...e, source: src, target: tgt };
    });

    const existingIds = new Set(nextNodes.map((n) => n.id));
    nextSlugs.forEach((slug, i) => {
      if (slug && !existingIds.has(slug)) {
        nextNodes.push({ id: slug, position: autoLayout(i) });
        existingIds.add(slug);
        nodesChanged = true;
      }
    });

    if (nodesChanged) form.setValue('workflow.nodes', nextNodes);
    if (edgesChanged) form.setValue('workflow.edges', nextEdges);

    prevSlugsRef.current = nextSlugs;
  }, [agents, form]);
}
