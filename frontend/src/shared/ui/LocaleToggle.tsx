'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/shared/i18n/navigation';
import { routing, type Locale } from '@/shared/i18n/routing';
import { Button } from './button';

const LABELS: Record<Locale, string> = { en: 'EN', 'pt-br': 'PT' };

export function LocaleToggle() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex gap-1">
      {routing.locales.map((l) => (
        <Button
          key={l}
          variant={l === locale ? 'default' : 'ghost'}
          size="sm"
          onClick={() => router.replace(pathname, { locale: l })}
        >
          {LABELS[l]}
        </Button>
      ))}
    </div>
  );
}
