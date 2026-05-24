import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import type {
  StockItem, Sale, Delivery, Supplier, DashboardSummary,
  ChartDataPoint, TopItem, CountryBreakdown, MonthlyRevenue, PaginatedResponse, User, StockMovement,
} from "@/types";

// --- Auth ---
export const useMe = () =>
  useQuery({ queryKey: ["me"], queryFn: () => api.get<User>("/auth/me").then((r) => r.data) });

// --- Dashboard ---
export const useDashboardSummary = () =>
  useQuery({ queryKey: ["dashboard", "summary"], queryFn: () => api.get<DashboardSummary>("/dashboard/summary").then((r) => r.data) });

export const useDashboardCharts = () =>
  useQuery({
    queryKey: ["dashboard", "charts"],
    queryFn: () =>
      api.get<ChartDataPoint[]>("/dashboard/charts").then((r) =>
        (r.data || []).map((d) => ({
          ...d,
          revenue: typeof d.revenue === "string" ? parseFloat(d.revenue) : d.revenue,
          profit: typeof d.profit === "string" ? parseFloat(d.profit) : d.profit,
        }))
      ),
  });

export const useTopItems = () =>
  useQuery({ queryKey: ["dashboard", "top-items"], queryFn: () => api.get<TopItem[]>("/dashboard/top-items").then((r) => r.data) });

export const useCountryBreakdown = () =>
  useQuery({ queryKey: ["dashboard", "country"], queryFn: () => api.get<CountryBreakdown[]>("/dashboard/country-breakdown").then((r) => r.data) });

export const useMonthlyRevenue = () =>
  useQuery({ queryKey: ["dashboard", "monthly"], queryFn: () => api.get<MonthlyRevenue[]>("/dashboard/monthly-revenue").then((r) => r.data) });

// --- Stock ---
export const useStock = (params?: Record<string, string | number | undefined>) =>
  useQuery({
    queryKey: ["stock", params],
    queryFn: () => api.get<PaginatedResponse<StockItem>>("/stock", { params }).then((r) => r.data),
  });

export const useStockItem = (id: string) =>
  useQuery({ queryKey: ["stock", id], queryFn: () => api.get<StockItem>(`/stock/${id}`).then((r) => r.data), enabled: !!id });

export const useLowStock = () =>
  useQuery({ queryKey: ["stock", "low"], queryFn: () => api.get<StockItem[]>("/stock/alerts/low").then((r) => r.data) });

export const useStockMovements = (id: string) =>
  useQuery({ queryKey: ["movements", id], queryFn: () => api.get<StockMovement[]>(`/stock/movements/${id}`).then((r) => r.data), enabled: !!id });

export const useCreateStock = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: object) => api.post("/stock", data).then((r) => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ["stock"] }) });
};

export const useUpdateStock = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }: { id: string; data: object }) => api.patch(`/stock/${id}`, data).then((r) => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ["stock"] }) });
};

export const useDeleteStock = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.delete(`/stock/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["stock"] }) });
};

export const useStockBySku = (sku: string) =>
  useQuery({
    queryKey: ["stock", "sku", sku],
    queryFn: () => api.get<StockItem>(`/stock/by-sku/${encodeURIComponent(sku)}`).then((r) => r.data),
    enabled: !!sku,
    retry: false,
  });

export const fetchStockBySku = (sku: string): Promise<StockItem | null> =>
  api.get<StockItem>(`/stock/by-sku/${encodeURIComponent(sku)}`).then((r) => r.data).catch(() => null);

export const useRestockItem = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }: { id: string; data: object }) => api.post(`/stock/${id}/restock`, data).then((r) => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ["stock"] }) });
};

// --- Sales ---
export const useSales = (params?: Record<string, string | number | undefined>) =>
  useQuery({ queryKey: ["sales", params], queryFn: () => api.get<PaginatedResponse<Sale>>("/sales", { params }).then((r) => r.data) });

export const useSale = (id: string) =>
  useQuery({ queryKey: ["sales", id], queryFn: () => api.get<Sale>(`/sales/${id}`).then((r) => r.data), enabled: !!id });

export const useCreateSale = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: object) => api.post("/sales", data).then((r) => r.data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["sales"] }); qc.invalidateQueries({ queryKey: ["stock"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); } });
};

export const useDeleteSale = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.delete(`/sales/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ["sales"] }); qc.invalidateQueries({ queryKey: ["stock"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); } });
};

// --- Deliveries ---
export const useDeliveries = (params?: Record<string, string | undefined>) =>
  useQuery({ queryKey: ["deliveries", params], queryFn: () => api.get<PaginatedResponse<Delivery>>("/deliveries", { params }).then((r) => r.data) });

export const useUpdateDeliveryStatus = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }: { id: string; data: object }) => api.patch(`/deliveries/${id}/status`, data).then((r) => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ["deliveries"] }) });
};

// --- Suppliers ---
export const useSuppliers = () =>
  useQuery({ queryKey: ["suppliers"], queryFn: () => api.get<PaginatedResponse<Supplier>>("/suppliers").then((r) => r.data) });

export const useCreateSupplier = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: object) => api.post("/suppliers", data).then((r) => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }) });
};

// --- Users ---
export const useUsers = () =>
  useQuery({ queryKey: ["users"], queryFn: () => api.get<PaginatedResponse<User>>("/users").then((r) => r.data) });

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: object) => api.post("/users", data).then((r) => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }) });
};

export const useToggleUserActive = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.patch(`/users/${id}/toggle-active`).then((r) => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }) });
};

// --- Shop Config ---
export interface ShopConfigItem {
  id: string;
  type: string;
  value: string;
  label: string;
  is_active: boolean;
  created_at: string;
}

export const useShopConfig = (type: string) =>
  useQuery({
    queryKey: ["shop-config", type],
    queryFn: () => api.get<ShopConfigItem[]>(`/shop-config/${type}`).then((r) => r.data),
  });

export const useAllShopConfigs = () =>
  useQuery({
    queryKey: ["shop-config", "all"],
    queryFn: async () => {
      const [categories, origins] = await Promise.all([
        api.get<ShopConfigItem[]>("/shop-config/category").then((r) => r.data),
        api.get<ShopConfigItem[]>("/shop-config/origin").then((r) => r.data),
      ]);
      return { categories, origins };
    },
  });

export const useCreateShopConfig = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { type: string; value: string; label: string }) =>
      api.post<ShopConfigItem>("/shop-config", data).then((r) => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["shop-config", vars.type] });
      qc.invalidateQueries({ queryKey: ["shop-config", "all"] });
    },
  });
};

export const useUpdateShopConfig = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, value, label }: { id: string; value?: string; label?: string }) =>
      api.patch<ShopConfigItem>(`/shop-config/${id}`, { value, label }).then((r) => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["shop-config", "threshold"] });
    },
  });
};

export const useDeleteShopConfig = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; type: string }) => api.delete(`/shop-config/${id}`),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["shop-config", vars.type] });
      qc.invalidateQueries({ queryKey: ["shop-config", "all"] });
    },
  });
};

export const useUploadStockImage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const form = new FormData();
      form.append("file", file);
      return api.post<StockItem>(`/stock/${id}/image`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then((r) => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stock"] }),
  });
};
