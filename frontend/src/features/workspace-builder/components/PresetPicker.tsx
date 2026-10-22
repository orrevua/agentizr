'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { UseFormReturn } from 'react-hook-form';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import { usePresetsQuery } from '../api/usePresetsQuery';
import { useApplyPreset } from '../hooks/useApplyPreset';
import type { WorkspaceDefinitionInput } from '../schema';

interface Props {
  form: UseFormReturn<WorkspaceDefinitionInput>;
  activeIndex: number;
}

export function PresetPicker({ form, activeIndex }: Props) {
  const t = useTranslations('presets');
  const tCommon = useTranslations('common');
  const [open, setOpen] = useState(false);
  const { data: presets } = usePresetsQuery();
  const apply = useApplyPreset(form, activeIndex);

  const onPick = (id: string) => {
    const preset = presets?.find((p) => p.id === id);
    if (!preset) return;
    apply(preset);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Sparkles className="h-4 w-4" />
          {t('button')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('dialogTitle')}</DialogTitle>
          <DialogDescription>{t('dialogDescription')}</DialogDescription>
        </DialogHeader>
        {!presets ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">{tCommon('loading')}</p>
        ) : (
          <ul className="grid max-h-[60vh] gap-2 overflow-y-auto">
            {presets.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onPick(p.id)}
                  className="w-full rounded-md border border-[var(--color-border)] p-3 text-left hover:bg-[var(--color-accent)]"
                >
                  <div className="font-medium">{p.label}</div>
                  <div className="text-xs text-[var(--color-muted-foreground)]">
                    {p.description}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
