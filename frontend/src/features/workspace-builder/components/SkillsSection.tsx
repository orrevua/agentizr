'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Button } from '@/shared/ui/button';
import type { WorkspaceDefinitionInput } from '../schema';
import { makeEmptySkill } from '../defaults';
import { SkillRow } from './SkillRow';

export function SkillsSection() {
  const t = useTranslations('workspace.skills');
  const { control } = useFormContext<WorkspaceDefinitionInput>();
  const { fields, append, remove } = useFieldArray({ control, name: 'skills' });
  const [open, setOpen] = useState(false);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex cursor-pointer items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]"
        >
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          {t('title', { count: fields.length })}
        </button>
        {open && (
          <Button type="button" variant="outline" size="sm" onClick={() => append(makeEmptySkill())}>
            <Plus className="h-4 w-4" />
            {t('add')}
          </Button>
        )}
      </div>
      {open && (
        <div className="space-y-3">
          {fields.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">{t('empty')}</p>
          ) : (
            fields.map((f, i) => (
              <SkillRow key={f.id} control={control} index={i} onRemove={() => remove(i)} />
            ))
          )}
        </div>
      )}
    </section>
  );
}
