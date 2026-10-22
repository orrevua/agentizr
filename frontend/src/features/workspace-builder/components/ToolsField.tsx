'use client';

import { useController, type Control } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { useToolsQuery } from '../api/useToolsQuery';
import type { WorkspaceDefinitionInput } from '../schema';
import { CatalogCombobox } from './CatalogCombobox';
import { FieldRow } from './FieldRow';

interface Props {
  control: Control<WorkspaceDefinitionInput>;
  basePath: `agents.${number}`;
}

export function ToolsField({ control, basePath }: Props) {
  const t = useTranslations('form');
  const { data, isLoading } = useToolsQuery();
  const { field } = useController({ control, name: `${basePath}.tools` as const });

  return (
    <FieldRow label={t('tools')}>
      <CatalogCombobox
        items={data ?? []}
        value={field.value}
        onChange={field.onChange}
        placeholder={t('toolsPlaceholder')}
        emptyLabel={t('toolsEmpty')}
        loading={isLoading}
      />
    </FieldRow>
  );
}
