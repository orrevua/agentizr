'use client';

import { useController, type Control } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Textarea } from '@/shared/ui/textarea';
import { cn } from '@/shared/lib/cn';
import type { WorkspaceDefinitionInput } from '../schema';
import { FieldRow } from './FieldRow';

interface Props {
  control: Control<WorkspaceDefinitionInput>;
  basePath: `agents.${number}`;
}

const COUNTER_THRESHOLDS = [
  { at: 50_000, className: 'text-[var(--color-destructive)] font-semibold' },
  { at: 6_000, className: 'text-amber-600' },
  { at: 0, className: 'text-[var(--color-muted-foreground)]' },
] as const;

function counterClass(len: number) {
  return COUNTER_THRESHOLDS.find((t) => len >= t.at)!.className;
}

export function InstructionsField({ control, basePath }: Props) {
  const t = useTranslations('form');
  const { field, fieldState } = useController({
    control,
    name: `${basePath}.instructions` as const,
  });
  const value = field.value ?? '';
  const len = value.length;

  return (
    <FieldRow
      htmlFor={`${basePath}-instructions`}
      label={t('instructions')}
      error={fieldState.error?.message}
    >
      <Textarea
        id={`${basePath}-instructions`}
        placeholder={t('instructionsPlaceholder')}
        className="min-h-[240px] font-mono text-sm"
        {...field}
        value={value}
      />
      <p className={cn('text-xs', counterClass(len))}>{len} / 50000</p>
    </FieldRow>
  );
}
