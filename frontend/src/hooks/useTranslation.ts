import { useLocaleStore, type Locale } from '@/lib/i18n';

export function useTranslation() {
  const locale = useLocaleStore((s) => s.locale);
  const t = useLocaleStore((s) => s.t);
  const setLocale = useLocaleStore((s) => s.setLocale);

  return {
    t,
    lang: locale,
    dir: t.dir,
    setLang: (l: Locale) => setLocale(l),
  };
}
