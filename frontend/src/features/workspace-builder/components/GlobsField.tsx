'use client';

import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { useController, type Control } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Badge } from '@/shared/ui/badge';
import { Input } from '@/shared/ui/input';
import type { WorkspaceDefinitionInput } from '../schema';
import { FieldRow } from './FieldRow';

interface Props {
  control: Control<WorkspaceDefinitionInput>;
  basePath: `agents.${number}`;
}

export function GlobsField({ control, basePath }: Props) {
  const t = useTranslations('form');
  const tCommon = useTranslations('common');
  const { field } = useController({ control, name: `${basePath}.applyToGlobs` as const });
  const values = field.value ?? [];
  const [draft, setDraft] = useState('');

  const add = (raw: string) => {
    const next = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => !values.includes(s));
    if (next.length) field.onChange([...values, ...next]);
    setDraft('');
  };

  const remove = (g: string) => field.onChange(values.filter((x) => x !== g));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (draft.trim()) add(draft);
    } else if (e.key === 'Backspace' && !draft && values.length) {
      remove(values[values.length - 1]);
    }
  };

  return (
    <FieldRow label={t('globs')}>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {values.map((g) => (
            <Badge key={g} variant="secondary" className="pr-1">
              <span className="font-mono text-xs">{g}</span>
              <button
                type="button"
                aria-label={`${tCommon('remove')} ${g}`}
                onClick={() => remove(g)}
                className="rounded-sm p-0.5 hover:bg-[var(--color-muted)]"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <Input
        placeholder={t('globsPlaceholder')}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => draft.trim() && add(draft)}
      />
    </FieldRow>
  );
}
