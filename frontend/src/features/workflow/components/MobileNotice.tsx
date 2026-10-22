'use client';

import { useTranslations } from 'next-intl';

export function MobileNotice() {
  const t = useTranslations('workflow');
  return (
    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/30 px-3 py-2 text-xs text-[var(--color-muted-foreground)]">
      {t('mobileNotice')}
    </div>
  );
}
