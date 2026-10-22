import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { LocaleToggle } from './LocaleToggle';

export async function Header() {
  const t = await getTranslations('common');
  return (
    <header className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
      <div className="flex items-center gap-3">
        <Image
          src="/wordmark.svg"
          alt={t('appName')}
          width={140}
          height={36}
          priority
          className="h-7 w-auto"
        />
        <span className="text-sm text-[var(--color-muted-foreground)] hidden sm:inline">
          {t('tagline')}
        </span>
      </div>
      <LocaleToggle />
    </header>
  );
}
