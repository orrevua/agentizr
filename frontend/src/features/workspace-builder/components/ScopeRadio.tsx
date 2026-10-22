'use client';

import { useController, type Control } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Label } from '@/shared/ui/label';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group';
import { SCOPES, type WorkspaceDefinitionInput } from '../schema';

interface Props {
  control: Control<WorkspaceDefinitionInput>;
  basePath: `agents.${number}`;
}

export function ScopeRadio({ control, basePath }: Props) {
  const t = useTranslations('scope');
  const tForm = useTranslations('form');
  const { field } = useController({ control, name: `${basePath}.scope` as const });

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {tForm('sectionScope')}
      </legend>
      <RadioGroup value={field.value} onValueChange={field.onChange}>
        {SCOPES.map((s) => {
          const id = `${basePath}-scope-${s}`;
          return (
            <div key={s} className="flex items-center gap-2">
              <RadioGroupItem id={id} value={s} />
              <Label htmlFor={id}>{t(s)}</Label>
            </div>
          );
        })}
      </RadioGroup>
    </fieldset>
  );
}
