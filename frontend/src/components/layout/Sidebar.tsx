import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Package, ShoppingCart, Truck, BarChart3,
  Bot, Users, X, ChevronRight, Settings,
} from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import { MusfiLogo } from "@/components/MusfiLogo";
import { cn } from "@/lib/utils";

const navItems = [
  { key: "dashboard", path: "/", icon: LayoutDashboard, roles: ["admin", "sales", "stock_manager"] },
  { key: "stock", path: "/stock", icon: Package, roles: ["admin", "sales", "stock_manager"] },
  { key: "sales", path: "/sales", icon: ShoppingCart, roles: ["admin", "sales"] },
  { key: "deliveries", path: "/deliveries", icon: Truck, roles: ["admin", "sales"] },
  { key: "reports", path: "/reports", icon: BarChart3, roles: ["admin", "stock_manager"] },
  { key: "ai_advisor", path: "/ai", icon: Bot, roles: ["admin", "sales", "stock_manager"] },
  { key: "users", path: "/users", icon: Users, roles: ["admin"] },
  { key: "settings", path: "/settings", icon: Settings, roles: ["admin"] },
];

export function Sidebar() {
  const { t } = useTranslation();
  const { sidebarOpen, setSidebar } = useUIStore();
  const user = useAuthStore((s) => s.user);

  const allowed = navItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
            onClick={() => setSidebar(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 z-30 h-full w-64 bg-card border-r border-border flex flex-col lg:translate-x-0 lg:static lg:z-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <MusfiLogo size={36} className="rounded-full" />
            <div>
              <p className="font-bold text-sm text-foreground">Musfi</p>
              <p className="text-xs text-muted-foreground">Hijab Shop</p>
            </div>
          </div>
          <button onClick={() => setSidebar(false)} className="lg:hidden p-1 hover:bg-accent rounded">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {allowed.map((item) => (
            <NavLink
              key={item.key}
              to={item.path}
              end={item.path === "/"}
              onClick={() => window.innerWidth < 1024 && setSidebar(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{t(`nav.${item.key}`)}</span>
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
            </NavLink>
          ))}
        </nav>

        {/* User */}
        {user && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary text-sm font-semibold">{user.name[0].toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role.replace("_", " ")}</p>
              </div>
            </div>
          </div>
        )}
      </motion.aside>
    </>
  );
}
