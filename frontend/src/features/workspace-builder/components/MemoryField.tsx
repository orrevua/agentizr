'use client';

import { useController, useWatch, type Control } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { MEMORIES, type WorkspaceDefinitionInput } from '../schema';
import { FieldRow } from './FieldRow';

interface Props {
  control: Control<WorkspaceDefinitionInput>;
  basePath: `agents.${number}`;
}

export function MemoryField({ control, basePath }: Props) {
  const t = useTranslations('form');
  const tMem = useTranslations('memory');
  const { field } = useController({ control, name: `${basePath}.memory` as const });
  const platforms = useWatch({ control, name: `${basePath}.targetPlatforms` as const });
  const disabled = !platforms.includes('claude-code');

  return (
    <FieldRow label={t('memory')} hint={disabled ? t('memoryClaudeOnly') : undefined}>
      <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MEMORIES.map((m) => (
            <SelectItem key={m} value={m}>
              {tMem(m)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldRow>
  );
}
