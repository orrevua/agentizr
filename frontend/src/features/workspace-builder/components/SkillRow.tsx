'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useController, type Control } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group';
import { Textarea } from '@/shared/ui/textarea';
import {
  SCOPES,
  SKILL_PLATFORMS,
  slugify,
  type WorkspaceDefinitionInput,
} from '../schema';
import type { SkillPlatform } from '../types';
import { FieldRow } from './FieldRow';

interface Props {
  control: Control<WorkspaceDefinitionInput>;
  index: number;
  onRemove: () => void;
}

export function SkillRow({ control, index, onRemove }: Props) {
  const t = useTranslations('workspace.skills');
  const tForm = useTranslations('form');
  const tPlatforms = useTranslations('platforms');
  const tScope = useTranslations('scope');
  const tCommon = useTranslations('common');

  const basePath = `skills.${index}` as const;
  const name = useController({ control, name: `${basePath}.name` as const });
  const description = useController({ control, name: `${basePath}.description` as const });
  const instructions = useController({ control, name: `${basePath}.instructions` as const });
  const platforms = useController({ control, name: `${basePath}.platforms` as const });
  const scope = useController({ control, name: `${basePath}.scope` as const });
  const scaffold = useController({ control, name: `${basePath}.scaffoldDirs` as const });
  const slug = useController({ control, name: `${basePath}.slug` as const });

  useEffect(() => {
    const next = slugify(name.field.value ?? '');
    if (next !== slug.field.value) slug.field.onChange(next);
  }, [name.field.value, slug.field]);

  const togglePlatform = (p: SkillPlatform, checked: boolean) => {
    const set = new Set(platforms.field.value);
    if (checked) set.add(p);
    else set.delete(p);
    platforms.field.onChange(Array.from(set));
  };

  return (
    <div className="space-y-4 rounded-md border border-[var(--color-border)] p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="grid flex-1 gap-3 md:grid-cols-2">
          <FieldRow label={tForm('name')} error={name.fieldState.error?.message}>
            <Input
              placeholder={t('namePlaceholder')}
              {...name.field}
              value={name.field.value ?? ''}
            />
          </FieldRow>
          <FieldRow label={tForm('slug')}>
            <Input readOnly value={slug.field.value ?? ''} className="opacity-70" />
          </FieldRow>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRemove}
          aria-label={tCommon('remove')}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <FieldRow label={tForm('description')} error={description.fieldState.error?.message}>
        <Input
          placeholder={tForm('descriptionPlaceholder')}
          {...description.field}
          value={description.field.value ?? ''}
        />
      </FieldRow>

      <FieldRow label={tForm('instructions')} error={instructions.fieldState.error?.message}>
        <Textarea
          rows={8}
          className="font-mono text-sm"
          {...instructions.field}
          value={instructions.field.value ?? ''}
        />
      </FieldRow>

      <div className="grid gap-4 md:grid-cols-3">
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{t('platforms')}</legend>
          {SKILL_PLATFORMS.map((p) => {
            const id = `${basePath}-platform-${p}`;
            const checked = platforms.field.value.includes(p);
            return (
              <div key={p} className="flex items-center gap-2">
                <Checkbox
                  id={id}
                  checked={checked}
                  onCheckedChange={(c) => togglePlatform(p, c)}
                />
                <Label htmlFor={id} className="cursor-pointer">
                  {tPlatforms(p)}
                </Label>
              </div>
            );
          })}
          {platforms.fieldState.error && (
            <p className="text-xs text-[var(--color-destructive)]">
              {platforms.fieldState.error.message}
            </p>
          )}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{tForm('sectionScope')}</legend>
          <RadioGroup value={scope.field.value} onValueChange={scope.field.onChange}>
            {SCOPES.map((s) => {
              const id = `${basePath}-scope-${s}`;
              return (
                <div key={s} className="flex items-center gap-2">
                  <RadioGroupItem id={id} value={s} />
                  <Label htmlFor={id}>{tScope(s)}</Label>
                </div>
              );
            })}
          </RadioGroup>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{t('scaffoldDirs')}</legend>
          <div className="flex items-center gap-2">
            <Checkbox
              id={`${basePath}-scaffold`}
              checked={scaffold.field.value}
              onCheckedChange={(c) => scaffold.field.onChange(Boolean(c))}
            />
            <Label htmlFor={`${basePath}-scaffold`} className="cursor-pointer">
              {t('scaffoldDirsLabel')}
            </Label>
          </div>
        </fieldset>
      </div>
    </div>
  );
}
