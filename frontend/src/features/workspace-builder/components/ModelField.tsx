'use client';

import { useMemo } from 'react';
import { useController, useWatch, type Control } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { useModelsQuery } from '../api/useModelsQuery';
import type { WorkspaceDefinitionInput } from '../schema';
import { FieldRow } from './FieldRow';

interface Props {
  control: Control<WorkspaceDefinitionInput>;
  basePath: `agents.${number}`;
}

export function ModelField({ control, basePath }: Props) {
  const t = useTranslations('form');
  const { data: models } = useModelsQuery();
  const platforms = useWatch({ control, name: `${basePath}.targetPlatforms` as const });
  const { field } = useController({ control, name: `${basePath}.model` as const });

  const filtered = useMemo(() => {
    if (!models) return [];
    const sel = new Set(platforms);
    return models.filter((m) => m.platforms.some((p) => sel.has(p)));
  }, [models, platforms]);

  return (
    <FieldRow label={t('model')}>
      <Select value={field.value} onValueChange={field.onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {filtered.length === 0 ? (
            <SelectItem value="inherit">{t('modelInherit')}</SelectItem>
          ) : (
            filtered.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.label}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </FieldRow>
  );
}
