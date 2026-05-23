import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { ErrorBoundary } from "@/pages/errors/ErrorBoundary";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const ResetPasswordPage = lazy(() => import("@/pages/auth/ResetPasswordPage"));
const DashboardPage = lazy(() => import("@/pages/dashboard/DashboardPage"));
const StockListPage = lazy(() => import("@/pages/stock/StockListPage"));
const SalesPage = lazy(() => import("@/pages/sales/SalesPage"));
const NewSalePage = lazy(() => import("@/pages/sales/NewSalePage"));
const DeliveriesPage = lazy(() => import("@/pages/deliveries/DeliveriesPage"));
const ReportsPage = lazy(() => import("@/pages/reports/ReportsPage"));
const AiAdvisorPage = lazy(() => import("@/pages/ai/AiAdvisorPage"));
const UsersPage = lazy(() => import("@/pages/admin/UsersPage"));
const SettingsPage = lazy(() => import("@/pages/admin/SettingsPage"));
const NotFoundPage = lazy(() => import("@/pages/errors/NotFoundPage"));

function AppLayout() {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuth = useAuthStore((s) => s.isAuthenticated());
  return isAuth ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuth = useAuthStore((s) => s.isAuthenticated());
  return isAuth ? <Navigate to="/" replace /> : <>{children}</>;
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  const theme = useUIStore((s) => s.theme);
  const syncSystemTheme = useUIStore((s) => s.syncSystemTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => syncSystemTheme();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [syncSystemTheme]);

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/stock" element={<StockListPage />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/sales/new" element={<NewSalePage />} />
            <Route path="/deliveries" element={<DeliveriesPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/ai" element={<AiAdvisorPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
