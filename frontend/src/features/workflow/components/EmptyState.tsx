'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/shared/ui/button';

interface Props {
  onAddAgent: () => void;
  canAdd: boolean;
}

export function EmptyState({ onAddAgent, canAdd }: Props) {
  const t = useTranslations('workflow');
  return (
    <div className="flex h-[200px] flex-col items-center justify-center gap-3 rounded-md border border-dashed border-[var(--color-border)] p-6 text-center">
      <p className="text-sm text-[var(--color-muted-foreground)]">{t('empty')}</p>
      <Button type="button" onClick={onAddAgent} disabled={!canAdd} variant="outline">
        <Plus className="h-4 w-4" />
        {t('addAnother')}
      </Button>
    </div>
  );
}
