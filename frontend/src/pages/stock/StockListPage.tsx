import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Plus, Search, Download, RefreshCw, Edit, Trash2, History, ImagePlus, X, ScanLine } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useStock, useLowStock, useRestockItem, useDeleteStock,
  useStockMovements, useCreateStock, useUpdateStock,
  useShopConfig, useUploadStockImage, fetchStockBySku,
} from "@/api/hooks";
import { useAuthStore } from "@/stores/authStore";
import { formatCurrency } from "@/lib/utils";
import type { StockItem } from "@/types";
import { BarcodeScanner } from "@/components/scanner/BarcodeScanner";
import { getSkuPrefix } from "@/hooks/useSkuPrefix";

export default function StockListPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const canEdit = user?.role === "admin" || user?.role === "stock_manager";

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [country, setCountry] = useState("");
  const [page, setPage] = useState(1);
  const [restockItem, setRestockItem] = useState<StockItem | null>(null);
  const [restockQty, setRestockQty] = useState(1);
  const [historyItem, setHistoryItem] = useState<StockItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<StockItem | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: categoryConfigs = [] } = useShopConfig("category");
  const { data: originConfigs = [] } = useShopConfig("origin");

  const params = {
    page,
    page_size: 20,
    ...(search && { search }),
    ...(category && { category }),
    ...(country && { origin_country: country }),
  };
  const { data, isLoading } = useStock(params);
  const { data: lowStock } = useLowStock();
  const { data: movements } = useStockMovements(historyItem?.id || "");
  const restock = useRestockItem();
  const deleteItem = useDeleteStock();
  const create = useCreateStock();
  const update = useUpdateStock();

  const handleRestock = async () => {
    if (!restockItem) return;
    await restock.mutateAsync({ id: restockItem.id, data: { quantity: restockQty } });
    setRestockItem(null);
    setRestockQty(1);
  };

  return (
    <PageWrapper title={t("stock.title")}>
      {lowStock && lowStock.length > 0 && (
        <div className="mb-4 flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 px-4 py-2.5 rounded-lg">
          <span className="text-amber-700 dark:text-amber-400 text-sm font-medium">
            ⚠ {t("stock.low_stock_warning", { count: lowStock.length })}
          </span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 mb-4 items-center justify-between">
        <div className="flex flex-wrap gap-2 flex-1 min-w-0">
          <div className="relative flex-1 min-w-44">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("stock.search")}
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Select value={category || "all"} onValueChange={(v) => { setCategory(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-40"><SelectValue placeholder={t("stock.filter_category")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {categoryConfigs.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={country || "all"} onValueChange={(v) => { setCountry(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-40"><SelectValue placeholder={t("stock.filter_country")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {originConfigs.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 shrink-0">
          {canEdit && (
            <Button size="sm" variant="outline" asChild>
              <a href="/api/v1/stock/export/csv" download>
                <Download className="w-4 h-4 mr-1" />{t("stock.export_csv")}
              </a>
            </Button>
          )}
          {canEdit && (
            <Button size="sm" onClick={() => { setEditItem(null); setFormOpen(true); }}>
              <Plus className="w-4 h-4 mr-1" />{t("stock.add_item")}
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("stock.name")}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("stock.category")}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">{t("stock.origin")}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">{t("stock.sku")}</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("stock.selling_price")}</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("stock.quantity")}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("stock.status")}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={8} className="px-4 py-3">
                          <div className="h-4 bg-muted rounded animate-pulse" />
                        </td>
                      </tr>
                    ))
                  : (data?.items || []).map((item) => (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="w-8 h-8 rounded-md object-cover border border-border shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-md border border-border bg-muted flex items-center justify-center shrink-0">
                                <ImagePlus className="w-3.5 h-3.5 text-muted-foreground" />
                              </div>
                            )}
                            <span className="font-medium text-foreground truncate max-w-[140px]">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="capitalize text-xs">{item.category}</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">{item.origin_country}</td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs hidden lg:table-cell">{item.sku || "—"}</td>
                        <td className="px-4 py-3 text-right font-semibold text-foreground">{formatCurrency(item.selling_price)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-bold text-sm ${item.quantity <= item.low_stock_threshold ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>
                            {item.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {item.quantity === 0
                            ? <Badge variant="destructive" className="text-xs">{t("stock.out_of_stock")}</Badge>
                            : item.quantity <= item.low_stock_threshold
                              ? <Badge variant="warning" className="text-xs">{t("stock.low_stock")}</Badge>
                              : <Badge variant="success" className="text-xs">{t("stock.in_stock")}</Badge>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-0.5">
                            {canEdit && (
                              <button
                                onClick={() => setRestockItem(item)}
                                className="p-1.5 hover:bg-accent rounded-md transition-colors"
                                title={t("stock.restock")}
                              >
                                <RefreshCw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              </button>
                            )}
                            <button
                              onClick={() => setHistoryItem(item)}
                              className="p-1.5 hover:bg-accent rounded-md transition-colors"
                              title={t("stock.movement_history")}
                            >
                              <History className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                            {canEdit && (
                              <button
                                onClick={() => { setEditItem(item); setFormOpen(true); }}
                                className="p-1.5 hover:bg-accent rounded-md transition-colors"
                                title={t("common.edit")}
                              >
                                <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                              </button>
                            )}
                            {user?.role === "admin" && (
                              <button
                                onClick={() => setDeleteTarget(item.id)}
                                className="p-1.5 hover:bg-destructive/10 rounded-md transition-colors"
                                title={t("common.delete")}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-destructive" />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                {!isLoading && (!data?.items || data.items.length === 0) && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      {t("common.no_data")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {data && data.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-sm text-muted-foreground">
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

      {/* Restock Dialog */}
      <Dialog open={!!restockItem} onOpenChange={(o) => !o && setRestockItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("stock.restock_title")}: <span className="text-primary">{restockItem?.name}</span></DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>{t("stock.quantity_to_add")}</Label>
              <Input type="number" min={1} value={restockQty} onChange={(e) => setRestockQty(Number(e.target.value))} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setRestockItem(null)}>{t("common.cancel")}</Button>
              <Button onClick={handleRestock} disabled={restock.isPending}>{t("stock.restock")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Movement History */}
      <Dialog open={!!historyItem} onOpenChange={(o) => !o && setHistoryItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("stock.movement_history")}: <span className="text-primary">{historyItem?.name}</span></DialogTitle>
          </DialogHeader>
          <div className="max-h-72 overflow-y-auto -mx-1 px-1 space-y-1 pt-2">
            {(movements || []).map((m) => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    m.type === "restock"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      : m.type === "sale"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                        : "bg-muted text-muted-foreground"
                  }`}>{m.type}</span>
                  {m.note && <span className="text-xs text-muted-foreground">{m.note}</span>}
                </div>
                <span className={`text-sm font-bold tabular-nums ${m.quantity > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {m.quantity > 0 ? "+" : ""}{m.quantity}
                </span>
              </div>
            ))}
            {(!movements || movements.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-6">{t("common.no_data")}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Form */}
      <StockFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        item={editItem}
        categories={categoryConfigs}
        origins={originConfigs}
        onSave={(d) =>
          editItem
            ? update.mutateAsync({ id: editItem.id, data: d })
            : create.mutateAsync(d)
        }
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteItem.mutate(deleteTarget);
          setDeleteTarget(null);
        }}
        loading={deleteItem.isPending}
      />
    </PageWrapper>
  );
}

type FormValues = Partial<StockItem> & { quantity?: number; cost_price?: number; selling_price?: number };
interface ConfigOption { value: string; label: string; }

function StockFormDialog({
  open, onClose, item, categories, origins, onSave,
}: {
  open: boolean;
  onClose: () => void;
  item: StockItem | null;
  categories: ConfigOption[];
  origins: ConfigOption[];
  onSave: (d: object) => Promise<StockItem>;
}) {
  const { t } = useTranslation();
  const { register, handleSubmit, control, formState: { isSubmitting }, reset, setValue } = useForm<FormValues>({ values: item || {} });
  const uploadImage = useUploadStockImage();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const skuPrefix = getSkuPrefix();
  const [skuStatus, setSkuStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const skuCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkSku = (sku: string) => {
    if (skuCheckTimer.current) clearTimeout(skuCheckTimer.current);
    const normalized = sku.trim();
    if (!normalized) { setSkuStatus("idle"); return; }
    // Skip check if editing and SKU unchanged
    if (item?.sku && normalized === item.sku) { setSkuStatus("available"); return; }
    setSkuStatus("checking");
    skuCheckTimer.current = setTimeout(async () => {
      const found = await fetchStockBySku(normalized);
      setSkuStatus(found ? "taken" : "available");
    }, 500);
  };

  useEffect(() => {
    setImageFile(null);
    setImagePreview(item?.image_url || null);
    if (!open) reset({});
  }, [item, open, reset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const onSubmit = async (data: FormValues) => {
    const saved = await onSave(data);
    if (imageFile) {
      await uploadImage.mutateAsync({ id: saved.id, file: imageFile });
    }
    onClose();
  };

  return (
    <>
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? t("stock.edit_item") : t("stock.add_item")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-1">

          {/* Image upload */}
          <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 border border-border">
            <div
              className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden bg-background shrink-0"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <ImagePlus className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-foreground">{t("stock.product_image")}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="h-8 text-xs w-fit">
                {imagePreview ? t("stock.change_photo") : t("stock.upload_photo")}
              </Button>
              {imageFile && (
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(item?.image_url || null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  className="flex items-center gap-1 text-xs text-destructive hover:underline w-fit"
                >
                  <X className="w-3 h-3" />{t("stock.remove_photo")}
                </button>
              )}
              <p className="text-xs text-muted-foreground">JPEG, PNG, WebP · max 5 MB</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
          </div>

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">{t("stock.name")} *</Label>
              <Input id="name" {...register("name", { required: true })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name_ta">{t("stock.name_tamil")}</Label>
              <Input id="name_ta" {...register("name_ta")} />
            </div>
          </div>

          {/* SKU + Category row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sku">
                {t("stock.sku")} <span className="text-xs font-normal text-muted-foreground">(optional)</span>
              </Label>
              <div className="flex gap-1.5">
                <div className="flex-1 relative">
                  <Input
                    id="sku"
                    {...register("sku", {
                      onChange: (e) => checkSku(e.target.value),
                    })}
                    placeholder={`${skuPrefix}-001`}
                    className={`pr-7 ${skuStatus === "taken" ? "border-destructive focus-visible:ring-destructive" : skuStatus === "available" ? "border-green-500 focus-visible:ring-green-500" : ""}`}
                  />
                  {skuStatus === "checking" && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border border-muted-foreground border-t-transparent rounded-full animate-spin" />
                  )}
                  {skuStatus === "available" && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500 text-xs font-bold">✓</span>
                  )}
                  {skuStatus === "taken" && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-destructive text-xs font-bold">✗</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setScannerOpen(true)}
                  title={t("scanner.scan_sku")}
                  className="shrink-0 w-9 h-9 flex items-center justify-center rounded-md border border-border bg-muted hover:bg-accent hover:border-primary transition-colors"
                >
                  <ScanLine className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              {skuStatus === "taken" && (
                <p className="text-xs text-destructive mt-1">{t("stock.sku_taken")}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>{t("stock.category")} *</Label>
              <Controller
                name="category"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("stock.select_category")} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Origin */}
          <div className="space-y-1.5">
            <Label>{t("stock.origin_source")} *</Label>
            <Controller
              name="origin_country"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Select value={field.value || ""} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("stock.select_origin")} />
                  </SelectTrigger>
                  <SelectContent>
                    {origins.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Prices + Quantity row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cost_price">{t("stock.cost_price")} *</Label>
              <Input id="cost_price" type="number" step="0.01" min={0} {...register("cost_price", { required: true, valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="selling_price">{t("stock.selling_price")} *</Label>
              <Input id="selling_price" type="number" step="0.01" min={0} {...register("selling_price", { required: true, valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quantity">{t("stock.quantity")}</Label>
              <Input id="quantity" type="number" defaultValue={0} min={0} {...register("quantity", { valueAsNumber: true })} />
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-2 justify-end pt-4 mt-1 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={isSubmitting || uploadImage.isPending}>
              {isSubmitting ? t("common.loading") : t("common.save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <BarcodeScanner
      open={scannerOpen}
      prefix={skuPrefix}
      onScan={(code) => {
        setValue("sku", code, { shouldDirty: true });
        setScannerOpen(false);
        checkSku(code);
      }}
      onClose={() => setScannerOpen(false)}
    />
    </>
  );
}
