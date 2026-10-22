'use client';

import { useController, type Control } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { OUTPUT_LANGUAGES, type WorkspaceDefinitionInput } from '../schema';
import { FieldRow } from './FieldRow';

interface Props {
  control: Control<WorkspaceDefinitionInput>;
}

export function OutputLanguageField({ control }: Props) {
  const t = useTranslations('form');
  const tLang = useTranslations('outputLanguage');
  const { field } = useController({ control, name: 'outputLanguage' });

  return (
    <FieldRow label={t('outputLanguage')}>
      <Select value={field.value} onValueChange={field.onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OUTPUT_LANGUAGES.map((l) => (
            <SelectItem key={l} value={l}>
              {tLang(l)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldRow>
  );
}
