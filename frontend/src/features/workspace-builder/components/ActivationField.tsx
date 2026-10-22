'use client';

import { useController, type Control } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { ACTIVATION_MODES, type WorkspaceDefinitionInput } from '../schema';
import type { ActivationMode } from '../types';
import { FieldRow } from './FieldRow';

interface Props {
  control: Control<WorkspaceDefinitionInput>;
  basePath: `agents.${number}`;
}

export const FIELD_VISIBILITY: Record<ActivationMode, { globs: boolean }> = {
  always: { globs: false },
  auto: { globs: true },
  on_demand: { globs: false },
  manual: { globs: false },
};

export function ActivationField({ control, basePath }: Props) {
  const t = useTranslations('form');
  const tAct = useTranslations('activation');
  const { field } = useController({ control, name: `${basePath}.activationMode` as const });

  return (
    <FieldRow label={t('activation')}>
      <Select value={field.value} onValueChange={field.onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ACTIVATION_MODES.map((m) => (
            <SelectItem key={m} value={m}>
              {tAct(m)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldRow>
  );
}
