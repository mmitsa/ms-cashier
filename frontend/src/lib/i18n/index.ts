import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ar, type Translations } from './ar';
import { en } from './en';

export type Locale = 'ar' | 'en';

const locales: Record<Locale, Translations> = { ar, en };

// Detect preferred locale from browser
function detectLocale(): Locale {
  const stored = localStorage.getItem('mpos-locale');
  if (stored === 'ar' || stored === 'en') return stored;

  const browserLang = navigator.language?.toLowerCase() || '';
  if (browserLang.startsWith('ar')) return 'ar';
  return 'en';
}

interface LocaleState {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => {
      const initial = detectLocale();
      return {
        locale: initial,
        t: locales[initial],
        setLocale: (locale: Locale) => {
          document.documentElement.lang = locales[locale].lang;
          document.documentElement.dir = locales[locale].dir;
          set({ locale, t: locales[locale] });
        },
      };
    },
    {
      name: 'mpos-locale',
      partialize: (state) => ({ locale: state.locale }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const t = locales[state.locale];
          state.t = t;
          document.documentElement.lang = t.lang;
          document.documentElement.dir = t.dir;
        }
      },
    }
  )
);

// Convenience hook
export function useT() {
  return useLocaleStore((s) => s.t);
}

export function useLocale() {
  return useLocaleStore((s) => s.locale);
}

export { type Translations };
