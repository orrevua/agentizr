'use client';

import { useController, type Control } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Input } from '@/shared/ui/input';
import type { WorkspaceDefinitionInput } from '../schema';
import { FieldRow } from './FieldRow';

interface Props {
  control: Control<WorkspaceDefinitionInput>;
  basePath: `agents.${number}`;
}

export function IdentityFields({ control, basePath }: Props) {
  const t = useTranslations('form');

  const name = useController({ control, name: `${basePath}.name` as const });
  const description = useController({ control, name: `${basePath}.description` as const });
  const slug = useController({ control, name: `${basePath}.slug` as const });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <FieldRow
        htmlFor={`${basePath}-name`}
        label={t('name')}
        error={name.fieldState.error?.message}
        hint={`${name.field.value?.length ?? 0} / 80`}
      >
        <Input
          id={`${basePath}-name`}
          placeholder={t('namePlaceholder')}
          {...name.field}
          value={name.field.value ?? ''}
        />
      </FieldRow>

      <FieldRow
        htmlFor={`${basePath}-slug`}
        label={t('slug')}
        error={slug.fieldState.error?.message}
      >
        <Input
          id={`${basePath}-slug`}
          readOnly
          value={slug.field.value ?? ''}
          className="opacity-70"
        />
      </FieldRow>

      <div className="md:col-span-2">
        <FieldRow
          htmlFor={`${basePath}-description`}
          label={t('description')}
          error={description.fieldState.error?.message}
          hint={`${description.field.value?.length ?? 0} / 300`}
        >
          <Input
            id={`${basePath}-description`}
            placeholder={t('descriptionPlaceholder')}
            {...description.field}
            value={description.field.value ?? ''}
          />
        </FieldRow>
      </div>
    </div>
  );
}
