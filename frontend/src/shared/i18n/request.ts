import { getRequestConfig } from 'next-intl/server';
import { routing, type Locale } from './routing';

function resolveLocale(requested: string | undefined): Locale {
  return (routing.locales as readonly string[]).includes(requested ?? '')
    ? (requested as Locale)
    : routing.defaultLocale;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = resolveLocale(await requestLocale);
  const messages = (await import(`../../../messages/${locale}.json`)).default;
  return { locale, messages };
});
