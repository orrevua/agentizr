'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useFormState, useWatch, type UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Input } from '@/shared/ui/input';
import { cn } from '@/shared/lib/cn';
import type { WorkspaceDefinitionInput } from '../schema';

interface Props {
  form: UseFormReturn<WorkspaceDefinitionInput>;
  fields: { id: string }[];
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
  onRename: (i: number, name: string) => void;
  canAdd: boolean;
  canRemove: boolean;
}

export function AgentTabs({
  form,
  fields,
  activeIndex,
  setActiveIndex,
  onAdd,
  onRemove,
  onRename,
  canAdd,
  canRemove,
}: Props) {
  const t = useTranslations('workspace');
  const tCommon = useTranslations('common');
  const agents = useWatch({ control: form.control, name: 'agents' });
  const { errors } = useFormState({ control: form.control });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState('');

  const startEditing = (i: number) => {
    setEditingIndex(i);
    setDraft(agents?.[i]?.name ?? '');
  };

  const commitEdit = () => {
    if (editingIndex !== null) {
      onRename(editingIndex, draft);
      setEditingIndex(null);
    }
  };

  return (
    <Tabs value={String(activeIndex)} onValueChange={(v) => setActiveIndex(Number(v))}>
      <TabsList className="flex-wrap">
        {fields.map((field, i) => {
          const agent = agents?.[i];
          const hasError = Array.isArray(errors.agents) && Boolean(errors.agents?.[i]);
          const displayName = agent?.name?.trim() || t('untitledAgent', { n: i + 1 });
          const isEditing = editingIndex === i;
          return (
            <TabsTrigger key={field.id} value={String(i)} onDoubleClick={() => startEditing(i)}>
              {isEditing ? (
                <Input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      commitEdit();
                    } else if (e.key === 'Escape') {
                      setEditingIndex(null);
                    }
                  }}
                  className="h-6 w-32 px-1 py-0 text-sm"
                />
              ) : (
                <span className={cn('truncate max-w-[160px]', hasError && 'text-[var(--color-destructive)]')}>
                  {displayName}
                </span>
              )}
              {hasError && !isEditing && (
                <span
                  aria-label={t('hasErrors')}
                  className="h-1.5 w-1.5 rounded-full bg-[var(--color-destructive)]"
                />
              )}
              {canRemove && (
                <button
                  type="button"
                  aria-label={`${tCommon('remove')} ${displayName}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(i);
                  }}
                  className="cursor-pointer rounded-sm p-0.5 hover:bg-[var(--color-muted)]"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </TabsTrigger>
          );
        })}
        <button
          type="button"
          onClick={onAdd}
          disabled={!canAdd}
          aria-label={t('addAgent')}
          className="ml-1 inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-3 w-3" />
          {t('addAgent')}
        </button>
      </TabsList>
    </Tabs>
  );
}
