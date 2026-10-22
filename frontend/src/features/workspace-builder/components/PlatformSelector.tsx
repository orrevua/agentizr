'use client';

import { useController, type Control } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Checkbox } from '@/shared/ui/checkbox';
import { Label } from '@/shared/ui/label';
import { PLATFORMS, type WorkspaceDefinitionInput } from '../schema';
import type { Platform } from '../types';

interface Props {
  control: Control<WorkspaceDefinitionInput>;
  basePath: `agents.${number}`;
}

export function PlatformSelector({ control, basePath }: Props) {
  const t = useTranslations('platforms');
  const tForm = useTranslations('form');
  const { field, fieldState } = useController({
    control,
    name: `${basePath}.targetPlatforms` as const,
  });

  const toggle = (platform: Platform, checked: boolean) => {
    const set = new Set(field.value);
    if (checked) set.add(platform);
    else set.delete(platform);
    field.onChange(Array.from(set));
  };

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {tForm('sectionPlatforms')}
      </legend>
      <div className="grid grid-cols-1 gap-2">
        {PLATFORMS.map((p) => {
          const id = `${basePath}-platform-${p}`;
          const checked = field.value.includes(p);
          return (
            <div key={p} className="flex items-center gap-2">
              <Checkbox id={id} checked={checked} onCheckedChange={(c) => toggle(p, c)} />
              <Label htmlFor={id} className="cursor-pointer">
                {t(p)}
              </Label>
            </div>
          );
        })}
      </div>
      {fieldState.error && (
        <p className="text-xs text-[var(--color-destructive)]">{fieldState.error.message}</p>
      )}
    </fieldset>
  );
}
