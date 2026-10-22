'use client';

import { useTranslations } from 'next-intl';
import { Label } from '@/shared/ui/label';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group';

export function OutputModeRadio() {
  const t = useTranslations('output');
  const tForm = useTranslations('form');

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {tForm('sectionOutput')}
      </legend>
      <RadioGroup value="per-platform">
        <div className="flex items-center gap-2">
          <RadioGroupItem id="output-per-platform" value="per-platform" />
          <Label htmlFor="output-per-platform">{t('perPlatform')}</Label>
        </div>
      </RadioGroup>
    </fieldset>
  );
}
