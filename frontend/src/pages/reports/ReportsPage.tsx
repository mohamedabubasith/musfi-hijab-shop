import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar, Legend,
} from "recharts";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardCharts, useTopItems, useCountryBreakdown, useMonthlyRevenue } from "@/api/hooks";
import { formatCurrency } from "@/lib/utils";

const CHART_COLORS = ["#C9A84C", "#8B5CF6", "#3B82F6", "#10B981", "#F59E0B"];

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

function PieTooltip({ active, payload }: { active?: boolean; payload?: { value: number; payload: { country: string } }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-foreground">{payload[0].payload.country}</p>
      <p className="text-muted-foreground">{payload[0].value} SKUs</p>
    </div>
  );
}

export default function ReportsPage() {
  const { t } = useTranslation();
  const { data: charts } = useDashboardCharts();
  const { data: topItems } = useTopItems();
  const { data: countries } = useCountryBreakdown();
  const { data: monthly } = useMonthlyRevenue();

  const chartData = (charts || []).slice(-30).reverse();
  const totalSKUs = (countries || []).reduce((s, c) => s + c.total_items, 0);
  const currentYear = new Date().getFullYear();

  const totalYearRevenue = (monthly || []).reduce((s, m) => s + m.revenue, 0);
  const totalYearProfit = (monthly || []).reduce((s, m) => s + m.profit, 0);

  return (
    <PageWrapper title={t("reports.title")}>
      <div className="space-y-6">

        {/* Monthly revenue bar chart */}
        <Card>
          <CardHeader className="pb-0 pt-5 px-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-semibold">{t("reports.monthly_revenue")}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">{t("reports.monthly_subtitle", { year: currentYear })}</p>
              </div>
              <div className="flex gap-4 text-xs">
                <div className="text-right">
                  <p className="text-muted-foreground">{t("reports.revenue")}</p>
                  <p className="font-bold text-amber-500 text-sm">{formatCurrency(totalYearRevenue)}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">{t("reports.profit")}</p>
                  <p className="font-bold text-emerald-500 text-sm">{formatCurrency(totalYearProfit)}</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-2 pt-4 pb-2">
            {(!monthly || monthly.length === 0) ? (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                {t("reports.no_data_month")}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthly} margin={{ top: 5, right: 10, left: 0, bottom: 0 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month_label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} width={44} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="bg-card border border-border rounded-xl shadow-lg px-3.5 py-2.5 text-xs min-w-[150px]">
                          <p className="font-semibold text-foreground mb-2">{label}</p>
                          {payload.map((entry) => (
                            <div key={String(entry.name)} className="flex items-center justify-between gap-4">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
                                <span className="text-muted-foreground capitalize">{String(entry.name)}</span>
                              </span>
                              <span className="font-semibold text-foreground">{formatCurrency(Number(entry.value))}</span>
                            </div>
                          ))}
                          <div className="mt-1.5 pt-1.5 border-t border-border text-muted-foreground">
                            {t("reports.sales_count")}: {payload[0]?.payload?.sales_count ?? 0}
                          </div>
                        </div>
                      );
                    }}
                    cursor={{ fill: "hsl(var(--accent))", radius: 4 }}
                  />
                  <Legend formatter={(v) => <span className="text-xs text-muted-foreground capitalize">{v}</span>} />
                  <Bar dataKey="revenue" name={t("reports.revenue")} fill="#C9A84C" radius={[4, 4, 0, 0]} maxBarSize={36} animationDuration={900} animationEasing="ease-out" />
                  <Bar dataKey="profit" name={t("reports.profit")} fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={36} animationDuration={1100} animationEasing="ease-out" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue vs Profit area chart */}
        <Card>
          <CardHeader className="pb-0 pt-5 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                {t("reports.revenue_vs_profit")}
              </CardTitle>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  {t("reports.revenue")}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  {t("reports.profit")}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-2 pt-4 pb-2">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="rGradRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="rGradProfit" x1="0" y1="0" x2="0" y2="1">
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
                  width={44}
                />
                <Tooltip content={<RevenueTooltip />} cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1, strokeDasharray: "4 4" }} />
                <Area type="monotone" dataKey="revenue" stroke="#C9A84C" strokeWidth={2.5} fill="url(#rGradRevenue)" dot={false} activeDot={{ r: 4, fill: "#C9A84C", strokeWidth: 0 }} animationDuration={1200} animationEasing="ease-out" />
                <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2.5} fill="url(#rGradProfit)" dot={false} activeDot={{ r: 4, fill: "#10b981", strokeWidth: 0 }} animationDuration={1400} animationEasing="ease-out" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-4">
          {/* Top items with bar indicator */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">{t("reports.top_items")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(topItems || []).map((item, i) => {
                  const max = topItems?.[0]?.total_sold || 1;
                  const pct = Math.round((item.total_sold / max) * 100);
                  return (
                    <div key={item.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold shrink-0">{i + 1}</span>
                          <span className="font-medium truncate">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-2">
                          <span className="text-xs text-muted-foreground">{item.total_sold} sold</span>
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(item.total_revenue)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.7, delay: i * 0.08, ease: "easeOut" }}
                          className="h-full rounded-full bg-primary"
                        />
                      </div>
                    </div>
                  );
                })}
                {(!topItems || topItems.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">{t("common.no_data")}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Country donut chart */}
          <Card>
            <CardHeader className="pb-0 pt-5 px-5">
              <CardTitle className="text-sm font-semibold">{t("reports.country_breakdown")}</CardTitle>
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
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground leading-tight">{totalSKUs}</p>
                    <p className="text-xs text-muted-foreground">SKUs</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {(countries || []).map((c, i) => (
                  <div key={c.country} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-foreground font-medium">{c.country}</span>
                    </div>
                    <span className="text-muted-foreground tabular-nums">{c.stock_count} units · {c.total_items} SKUs</span>
                  </div>
                ))}
                {(!countries || countries.length === 0) && (
                  <p className="text-xs text-muted-foreground text-center py-2">{t("common.no_data")}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
