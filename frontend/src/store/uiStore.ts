import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  activeModule: string;
  theme: 'light' | 'dark';
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveModule: (module: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activeModule: 'pos',
  theme: 'light',

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveModule: (module) => set({ activeModule: module }),
  setTheme: (theme) => set({ theme }),
}));
