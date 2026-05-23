import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { TrendingUp, Package, Truck, AlertTriangle } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardSummary, useDashboardCharts, useTopItems, useCountryBreakdown, useSales } from "@/api/hooks";
import { formatCurrency, formatDate } from "@/lib/utils";

const CHART_COLORS = ["#C9A84C", "#8B5CF6", "#3B82F6", "#10B981", "#F59E0B"];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.35 } }),
};

function RevenueTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-lg px-3.5 py-2.5 text-xs min-w-[130px]">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-muted-foreground capitalize">{entry.name}</span>
          </span>
          <span className="font-semibold text-foreground">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { country: string } }[] }) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="bg-card border border-border rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-foreground">{entry.payload.country}</p>
      <p className="text-muted-foreground">{entry.value} SKUs</p>
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { data: summary, isLoading } = useDashboardSummary();
  const { data: charts } = useDashboardCharts();
  const { data: topItems } = useTopItems();
  const { data: countries } = useCountryBreakdown();
  const { data: recentSales } = useSales({ page: 1, page_size: 5 });

  const metrics = summary
    ? [
        { label: t("dashboard.today_revenue"), value: formatCurrency(summary.today_revenue), icon: TrendingUp, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
        { label: t("dashboard.today_profit"), value: formatCurrency(summary.today_profit), icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
        { label: t("dashboard.total_stock"), value: summary.total_stock_count.toLocaleString(), icon: Package, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
        { label: t("dashboard.pending_deliveries"), value: summary.pending_deliveries.toString(), icon: Truck, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20" },
      ]
    : [];

  const chartData = (charts || []).slice(-7).reverse();
  const totalSKUs = (countries || []).reduce((s, c) => s + c.total_items, 0);

  return (
    <PageWrapper title={t("dashboard.title")}>
      {summary && summary.low_stock_count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 text-amber-800 dark:text-amber-400 px-4 py-3 rounded-lg"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="text-sm font-medium">
            {t("dashboard.low_stock_items", { count: summary.low_stock_count })}
          </span>
        </motion.div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
            ))
          : metrics.map((m, i) => (
              <motion.div key={m.label} custom={i} variants={cardVariants} initial="hidden" animate="visible">
                <Card className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-muted-foreground font-medium">{m.label}</p>
                      <div className={`p-1.5 rounded-lg ${m.bg}`}>
                        <m.icon className={`w-4 h-4 ${m.color}`} />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-foreground tracking-tight">{m.value}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* Revenue area chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-0 pt-5 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">{t("dashboard.revenue_trend")}</CardTitle>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Revenue
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Profit
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-2 pt-4 pb-2">
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  axisLine={false}
                  tickLine={false}
                  width={42}
                />
                <Tooltip content={<RevenueTooltip />} cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1, strokeDasharray: "4 4" }} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#C9A84C"
                  strokeWidth={2.5}
                  fill="url(#gradRevenue)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#C9A84C", strokeWidth: 0 }}
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#gradProfit)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#10b981", strokeWidth: 0 }}
                  animationDuration={1400}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Country donut chart */}
        <Card>
          <CardHeader className="pb-0 pt-5 px-5">
            <CardTitle className="text-sm font-semibold">{t("dashboard.country_breakdown")}</CardTitle>
          </CardHeader>
          <CardContent className="pt-3 px-4 pb-4">
            <div className="relative">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={countries || []}
                    dataKey="total_items"
                    nameKey="country"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                    strokeWidth={0}
                    animationBegin={200}
                    animationDuration={1000}
                    animationEasing="ease-out"
                  >
                    {(countries || []).map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground leading-tight">{totalSKUs}</p>
                  <p className="text-xs text-muted-foreground">SKUs</p>
                </div>
              </div>
            </div>
            {/* Legend */}
            <div className="mt-3 space-y-1.5">
              {(countries || []).map((c, i) => (
                <div key={c.country} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-foreground font-medium">{c.country}</span>
                  </div>
                  <span className="text-muted-foreground tabular-nums">{c.total_items} SKUs</span>
                </div>
              ))}
              {(!countries || countries.length === 0) && (
                <p className="text-xs text-muted-foreground text-center py-2">{t("common.no_data")}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Top items */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t("dashboard.top_items")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(topItems || []).slice(0, 5).map((item, i) => {
                const max = topItems?.[0]?.total_sold || 1;
                const pct = Math.round((item.total_sold / max) * 100);
                return (
                  <div key={item.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold shrink-0">{i + 1}</span>
                        <span className="text-sm font-medium truncate">{item.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">{item.total_sold} sold</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                        className="h-full rounded-full bg-primary"
                      />
                    </div>
                  </div>
                );
              })}
              {(!topItems || topItems.length === 0) && (
                <p className="text-sm text-muted-foreground">{t("common.no_data")}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent sales */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t("dashboard.recent_sales")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(recentSales?.items || []).map((sale, i) => (
                <motion.div
                  key={sale.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{sale.invoice_number}</p>
                    <p className="text-xs text-muted-foreground truncate">{sale.customer_name || "Walk-in"} · {formatDate(sale.created_at)}</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 ml-3 shrink-0">{formatCurrency(sale.total)}</span>
                </motion.div>
              ))}
              {(!recentSales?.items || recentSales.items.length === 0) && (
                <p className="text-sm text-muted-foreground">{t("common.no_data")}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
