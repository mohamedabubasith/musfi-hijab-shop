export type Role = "admin" | "sales" | "stock_manager";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  is_active: boolean;
  created_at?: string;
}

export interface StockItem {
  id: string;
  name: string;
  name_ta?: string;
  category: string;
  supplier_id?: string;
  origin_country: string;
  sku?: string;
  cost_price: number;
  selling_price: number;
  quantity: number;
  low_stock_threshold: number;
  image_url?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface StockMovement {
  id: string;
  item_id: string;
  type: string;
  quantity: number;
  note?: string;
  created_by?: string;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  country: string;
  contact?: string;
  phone?: string;
  email?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
}

export interface SaleItem {
  id: string;
  stock_item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  invoice_number: string;
  customer_id?: string;
  customer_name?: string;
  payment_method: string;
  subtotal: number;
  discount: number;
  total: number;
  cost_total: number;
  profit: number;
  is_delivery: boolean;
  notes?: string;
  sold_by?: string;
  sale_date: string;
  created_at: string;
  items: SaleItem[];
}

export interface Delivery {
  id: string;
  sale_id: string;
  customer_name: string;
  phone?: string;
  address: string;
  status: "pending" | "packed" | "in_transit" | "delivered" | "returned";
  assigned_to?: string;
  notes?: string;
  expected_date?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardSummary {
  today_revenue: number;
  today_profit: number;
  today_sales_count: number;
  monthly_revenue: number;
  monthly_profit: number;
  total_stock_count: number;
  pending_deliveries: number;
  low_stock_count: number;
}

export interface ChartDataPoint {
  label: string;
  revenue: number;
  profit: number;
}

export interface TopItem {
  id: string;
  name: string;
  category: string;
  total_sold: number;
  total_revenue: number;
}

export interface CountryBreakdown {
  country: string;
  stock_count: number;
  total_items: number;
}

export interface MonthlyRevenue {
  month: number;
  month_label: string;
  revenue: number;
  profit: number;
  sales_count: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}
