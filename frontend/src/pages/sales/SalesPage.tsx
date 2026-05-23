import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Search, TrendingUp, ShoppingBag, Receipt, Trash2 } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useSales, useDeleteSale } from "@/api/hooks";
import { useAuthStore } from "@/stores/authStore";
import { formatCurrency, formatDate } from "@/lib/utils";

const PAYMENT_COLORS: Record<string, string> = {
  cash: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  upi: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  card: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
  online: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
};
const PAYMENT_ICONS: Record<string, string> = { cash: "💵", upi: "📱", card: "💳", online: "🌐" };

type PayFilter = "all" | "cash" | "upi" | "card" | "online";

export default function SalesPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [payFilter, setPayFilter] = useState<PayFilter>("all");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const deleteSale = useDeleteSale();

  const params: Record<string, string | number> = { page, page_size: 20 };
  if (search) params.search = search;
  if (payFilter !== "all") params.payment_method = payFilter;

  const { data, isLoading } = useSales(params);

  const payFilters: { key: PayFilter; label: string }[] = [
    { key: "all", label: t("common.all") },
    { key: "cash", label: t("sales.payment.cash") },
    { key: "upi", label: "UPI" },
    { key: "card", label: t("sales.payment.card") },
    { key: "online", label: t("sales.payment.online") },
  ];

  const totalRevenue = data?.items.reduce((s, i) => s + i.total, 0) ?? 0;
  const totalProfit = data?.items.reduce((s, i) => s + i.profit, 0) ?? 0;

  return (
    <PageWrapper title={t("sales.title")}>
      {/* Header */}
      <div className="flex flex-wrap gap-3 items-center justify-between mb-5">
        <div className="flex flex-col">
          <p className="text-sm text-muted-foreground">
            {data ? t("sales.total_count", { count: data.total }) : ""}
          </p>
        </div>
        <Button size="sm" asChild>
          <Link to="/sales/new">
            <Plus className="w-4 h-4 mr-1.5" />
            {t("sales.new_sale")}
          </Link>
        </Button>
      </div>

      {/* Stats strip */}
      {data && data.items.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("sales.showing")}</p>
              <p className="text-sm font-bold text-foreground">{data.items.length} {t("sales.items")}</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <Receipt className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("sales.revenue")}</p>
              <p className="text-sm font-bold text-foreground">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("reports.profit")}</p>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalProfit)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("sales.search_sales")}
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          {payFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => { setPayFilter(f.key); setPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                payFilter === f.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.key !== "all" && <span>{PAYMENT_ICONS[f.key]}</span>}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("sales.invoice_number")}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("sales.customer")}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("sales.payment_method")}</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("sales.total")}</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">{t("sales.profit")}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={7} className="px-4 py-3">
                          <div className="h-4 bg-muted rounded animate-pulse" />
                        </td>
                      </tr>
                    ))
                  : (data?.items || []).length === 0
                  ? (
                      <tr>
                        <td colSpan={7}>
                          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                            <ShoppingBag className="w-10 h-10 opacity-30" />
                            <p className="text-sm">{t("common.no_data")}</p>
                          </div>
                        </td>
                      </tr>
                    )
                  : (data?.items || []).map((sale) => (
                      <tr key={sale.id} className="hover:bg-accent/40 transition-colors group">
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
                            {sale.invoice_number}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-medium text-foreground">{sale.customer_name || "—"}</span>
                          {sale.is_delivery && (
                            <Badge variant="secondary" className="ml-2 text-xs">Delivery</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground text-xs hidden sm:table-cell">
                          {formatDate(sale.sale_date)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${PAYMENT_COLORS[sale.payment_method] || "bg-muted text-muted-foreground"}`}>
                            {PAYMENT_ICONS[sale.payment_method]}
                            {t(`sales.payment.${sale.payment_method}`)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-semibold text-foreground">
                          {formatCurrency(sale.total)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-semibold text-emerald-600 dark:text-emerald-400 hidden md:table-cell">
                          {formatCurrency(sale.profit)}
                        </td>
                        <td className="px-4 py-3.5 text-right text-xs text-muted-foreground">
                          <div className="flex items-center justify-end gap-2">
                            {sale.discount > 0 && (
                              <span className="text-orange-500">-{formatCurrency(sale.discount)}</span>
                            )}
                            {isAdmin && (
                              <button
                                onClick={() => setDeleteTarget(sale.id)}
                                className="p-1 hover:bg-destructive/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                title={t("common.delete")}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-destructive" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {data && data.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-muted-foreground">
                {t("common.page")} {data.page} {t("common.of")} {data.pages}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  {t("common.prev")}
                </Button>
                <Button size="sm" variant="outline" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>
                  {t("common.next")}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteSale.mutate(deleteTarget);
          setDeleteTarget(null);
        }}
        loading={deleteSale.isPending}
      />
    </PageWrapper>
  );
}
