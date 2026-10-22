'use client';

import { useController, type Control } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { useMcpServersQuery } from '../api/useMcpServersQuery';
import type { WorkspaceDefinitionInput } from '../schema';
import { CatalogCombobox } from './CatalogCombobox';
import { FieldRow } from './FieldRow';

interface Props {
  control: Control<WorkspaceDefinitionInput>;
  basePath: `agents.${number}`;
}

export function McpServersField({ control, basePath }: Props) {
  const t = useTranslations('form');
  const { data, isLoading } = useMcpServersQuery();
  const { field } = useController({ control, name: `${basePath}.mcpServers` as const });

  return (
    <FieldRow label={t('mcpServers')}>
      <CatalogCombobox
        items={data ?? []}
        value={field.value}
        onChange={field.onChange}
        placeholder={t('mcpPlaceholder')}
        emptyLabel={t('mcpEmpty')}
        loading={isLoading}
      />
    </FieldRow>
  );
}
