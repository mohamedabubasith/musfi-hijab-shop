import { create } from "zustand";

type Theme = "light" | "dark";

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveInitialTheme(): Theme {
  // Only respect saved theme if user explicitly chose it (themeManual flag)
  const isManual = localStorage.getItem("themeManual") === "true";
  if (isManual) return (localStorage.getItem("theme") as Theme) ?? getSystemTheme();
  return getSystemTheme();
}

interface UIState {
  sidebarOpen: boolean;
  theme: Theme;
  themeManual: boolean;
  pageTitle: string;
  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  syncSystemTheme: () => void;
  setPageTitle: (title: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: window.innerWidth >= 1024,
  theme: resolveInitialTheme(),
  themeManual: localStorage.getItem("themeManual") === "true",
  pageTitle: "",
  setPageTitle: (title) => set({ pageTitle: title }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebar: (open) => set({ sidebarOpen: open }),
  toggleTheme: () =>
    set((s) => {
      const next: Theme = s.theme === "light" ? "dark" : "light";
      localStorage.setItem("theme", next);
      localStorage.setItem("themeManual", "true");
      return { theme: next, themeManual: true };
    }),
  setTheme: (t) => {
    localStorage.setItem("theme", t);
    localStorage.setItem("themeManual", "true");
    set({ theme: t, themeManual: true });
  },
  syncSystemTheme: () => {
    if (!get().themeManual) {
      set({ theme: getSystemTheme() });
    }
  },
}));
