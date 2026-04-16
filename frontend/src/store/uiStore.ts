import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface UIState {
  sidebarOpen: boolean;
  activeModule: string;
  theme: Theme;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveModule: (module: string) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

function applyThemeToDOM(theme: Theme) {
  const root = document.documentElement;
  const resolved =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;

  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      activeModule: 'pos',
      theme: 'light',

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setActiveModule: (module) => {
        set({ activeModule: module });
        if (typeof window !== 'undefined') {
          window.location.hash = module === 'pos' ? '' : module;
        }
      },

      setTheme: (theme) => {
        applyThemeToDOM(theme);
        set({ theme });
      },

      toggleTheme: () => {
        const current = get().theme;
        const next = current === 'dark' ? 'light' : 'dark';
        applyThemeToDOM(next);
        set({ theme: next });
      },
    }),
    {
      name: 'mpos-ui',
      partialize: (state) => ({ theme: state.theme, activeModule: state.activeModule }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme) applyThemeToDOM(state.theme);
        // URL hash takes priority over persisted state (allows bookmarking)
        if (typeof window !== 'undefined') {
          const hash = window.location.hash.replace('#', '');
          if (hash && state) state.activeModule = hash;
        }
      },
    }
  )
);

// Listen for system theme changes when theme is 'system'
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const { theme } = useUIStore.getState();
    if (theme === 'system') applyThemeToDOM('system');
  });

  // Sync activeModule when user navigates with browser back/forward
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    const { activeModule, setActiveModule } = useUIStore.getState();
    if (hash && hash !== activeModule) setActiveModule(hash);
    if (!hash && activeModule !== 'pos') setActiveModule('pos');
  });
}
