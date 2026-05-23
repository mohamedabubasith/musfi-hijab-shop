import { Menu, Bell, Globe, LogOut, Sun, Moon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUIStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { api } from "@/api/client";
import { useLowStock } from "@/api/hooks";

export function Topbar() {
  const { t, i18n } = useTranslation();
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const { theme, toggleTheme, pageTitle } = useUIStore();
  const { user, logout } = useAuthStore();
  const { data: lowStock } = useLowStock();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout", { refresh_token: "" });
    } catch {}
    logout();
    window.location.href = "/login";
  };

  const toggleLang = () => {
    const next = i18n.language === "en" ? "ta" : "en";
    i18n.changeLanguage(next);
    localStorage.setItem("lang", next);
  };

  return (
    <header className="sticky top-0 z-10 h-14 bg-background border-b border-border flex items-center justify-between px-4 gap-4">
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar} className="p-2 hover:bg-accent rounded-lg lg:hidden">
          <Menu className="w-5 h-5 text-muted-foreground" />
        </button>
        {pageTitle && <h1 className="text-base font-semibold text-foreground">{pageTitle}</h1>}
      </div>

      <div className="flex items-center gap-2">
        {lowStock && lowStock.length > 0 && (
          <div className="relative">
            <button className="p-2 hover:bg-accent rounded-lg relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </button>
          </div>
        )}

        <Button variant="ghost" size="sm" onClick={toggleTheme} className="p-2" title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        <Button variant="ghost" size="sm" onClick={toggleLang} className="gap-1.5 text-xs font-medium">
          <Globe className="w-4 h-4" />
          {i18n.language === "en" ? "தமிழ்" : "EN"}
        </Button>

        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5 text-xs">
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">{t("nav.logout")}</span>
        </Button>
      </div>
    </header>
  );
}
