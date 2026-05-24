import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Trash2, CheckCircle, Search, ScanLine, ShoppingCart, Receipt, Truck, ArrowLeft } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStock, useCreateSale, fetchStockBySku } from "@/api/hooks";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { BarcodeScanner } from "@/components/scanner/BarcodeScanner";
import { getSkuPrefix } from "@/hooks/useSkuPrefix";
import type { StockItem } from "@/types";

interface CartItem { item: StockItem; qty: number }

const PAYMENT_ICONS: Record<string, string> = { cash: "💵", upi: "📱", card: "💳", online: "🌐" };

export default function NewSalePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createSale = useCreateSale();

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discount, setDiscount] = useState(0);
  const [isDelivery, setIsDelivery] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [addressError, setAddressError] = useState(false);
  const skuPrefix = getSkuPrefix();

  const { data: stockData } = useStock({ search, page_size: 12 });

  const addToCart = (item: StockItem) => {
    if (item.quantity <= 0) { toast.error(t("sales.out_of_stock")); return; }
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) return prev.map((c) => c.item.id === item.id ? { ...c, qty: Math.min(c.qty + 1, item.quantity) } : c);
      return [...prev, { item, qty: 1 }];
    });
    setSearch("");
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((c) => c.item.id === id ? { ...c, qty: Math.max(1, Math.min(c.qty + delta, c.item.quantity)) } : c)
        .filter((c) => c.qty > 0)
    );
  };

  const handleScan = async (sku: string) => {
    const item = await fetchStockBySku(sku);
    if (!item) { toast.error(t("sales.sku_not_found", { sku })); return; }
    addToCart(item);
    toast.success(`${item.name} ${t("sales.added_to_cart")}`);
  };

  const subtotal = cart.reduce((sum, c) => sum + c.item.selling_price * c.qty, 0);
  const total = Math.max(0, subtotal - discount);

  const handleSubmit = async () => {
    if (cart.length === 0) { toast.error(t("sales.empty_cart")); return; }
    if (!customerName.trim()) { setNameError(true); return; }
    if (isDelivery && !deliveryAddress.trim()) { setAddressError(true); return; }
    try {
      const res = await createSale.mutateAsync({
        customer_name: customerName || undefined,
        payment_method: paymentMethod,
        discount,
        is_delivery: isDelivery,
        items: cart.map((c) => ({ stock_item_id: c.item.id, quantity: c.qty })),
        delivery_address: isDelivery ? deliveryAddress : undefined,
        delivery_phone: isDelivery ? deliveryPhone : undefined,
      });
      setConfirmed((res as { invoice_number: string }).invoice_number);
    } catch {
      // interceptor already shows the error toast
    }
  };

  if (confirmed) {
    return (
      <PageWrapper title={t("sales.new_sale")}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center justify-center min-h-[60vh] gap-5"
        >
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 180 }}>
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
          </motion.div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">{t("sales.sale_confirmed")}</h2>
            <p className="text-muted-foreground mt-1">{t("sales.invoice_number")}</p>
            <p className="font-mono font-bold text-primary text-2xl mt-1">{confirmed}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/sales")}>{t("sales.view_all")}</Button>
            <Button onClick={() => { setCart([]); setConfirmed(null); setCustomerName(""); setDiscount(0); }}>
              {t("sales.new_sale")}
            </Button>
          </div>
        </motion.div>
      </PageWrapper>
    );
  }

  const results = (stockData?.items || []).filter((i) => i.quantity > 0);

  return (
    <PageWrapper title={t("sales.new_sale")}>
      {/* Back breadcrumb */}
      <div className="mb-4">
        <button
          onClick={() => navigate("/sales")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t("sales.title")}
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">

        {/* ── Left: product search + cart ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Search bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("sales.search_items")}
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setScannerOpen(true)}
              title={t("scanner.scan_sku")}
              className="shrink-0 border-primary/40 hover:bg-primary hover:text-primary-foreground hover:border-primary"
            >
              <ScanLine className="w-4 h-4" />
            </Button>
          </div>

          {/* Search results */}
          <AnimatePresence>
            {search && (
              <motion.div
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              >
                <Card>
                  <CardContent className="p-2">
                    {results.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">{t("common.no_data")}</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                        {results.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => addToCart(item)}
                            className="text-left p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all group"
                          >
                            <p className="text-sm font-semibold text-foreground leading-tight line-clamp-2 group-hover:text-primary">{item.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{item.sku || item.category}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-sm font-bold text-primary">{formatCurrency(item.selling_price)}</span>
                              <span className="text-xs text-muted-foreground">{item.quantity} left</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cart */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-primary" />
                  {t("sales.cart")}
                </CardTitle>
                {cart.length > 0 && (
                  <Badge variant="secondary">{cart.length} {t("sales.items")}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                  <ShoppingCart className="w-8 h-8 opacity-30" />
                  <p className="text-sm">{t("sales.empty_cart_hint")}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {/* Header */}
                  <div className="grid grid-cols-[1fr_auto_auto] gap-3 pb-2 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <span>{t("sales.item")}</span>
                    <span className="text-center w-24">{t("sales.qty")}</span>
                    <span className="text-right w-20">{t("sales.subtotal")}</span>
                  </div>
                  <AnimatePresence>
                    {cart.map((c) => (
                      <motion.div
                        key={c.item.id}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                        className="grid grid-cols-[1fr_auto_auto] gap-3 items-center py-2.5 border-b border-border/50 last:border-0"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{c.item.name}</p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(c.item.selling_price)} each</p>
                        </div>
                        <div className="flex items-center gap-1 w-24 justify-center">
                          <button
                            onClick={() => updateQty(c.item.id, -1)}
                            className="w-6 h-6 rounded-md bg-muted hover:bg-accent flex items-center justify-center transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-bold">{c.qty}</span>
                          <button
                            onClick={() => updateQty(c.item.id, 1)}
                            disabled={c.qty >= c.item.quantity}
                            className="w-6 h-6 rounded-md bg-muted hover:bg-accent flex items-center justify-center transition-colors disabled:opacity-40"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 w-20 justify-end">
                          <span className="text-sm font-semibold">{formatCurrency(c.item.selling_price * c.qty)}</span>
                          <button
                            onClick={() => setCart((p) => p.filter((x) => x.item.id !== c.item.id))}
                            className="p-1 hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right: checkout ── */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Receipt className="w-4 h-4 text-primary" />
                {t("sales.checkout")}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-4">

              {/* Customer */}
              <div className="space-y-1.5">
                <Label className="text-xs">{t("sales.customer")} <span className="text-destructive">*</span></Label>
                <Input
                  placeholder={t("sales.walk_in")}
                  value={customerName}
                  onChange={(e) => { setCustomerName(e.target.value); if (e.target.value.trim()) setNameError(false); }}
                  className={nameError ? "border-destructive" : ""}
                />
                {nameError && <p className="text-xs text-destructive">{t("common.required")}</p>}
              </div>

              {/* Payment */}
              <div className="space-y-1.5">
                <Label className="text-xs">{t("sales.payment_method")}</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {["cash", "upi", "card", "online"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPaymentMethod(p)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                        paymentMethod === p
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50 text-muted-foreground"
                      }`}
                    >
                      <span>{PAYMENT_ICONS[p]}</span>
                      {t(`sales.payment.${p}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Discount */}
              <div className="space-y-1.5">
                <Label className="text-xs">{t("sales.discount")} (₹)</Label>
                <Input
                  type="number" min={0} max={subtotal}
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                  className="text-sm"
                />
              </div>

              {/* Delivery toggle */}
              <div
                onClick={() => setIsDelivery(!isDelivery)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                  isDelivery ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                }`}
              >
                <Truck className={`w-4 h-4 ${isDelivery ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-sm font-medium ${isDelivery ? "text-primary" : "text-muted-foreground"}`}>
                  {t("sales.delivery_sale")}
                </span>
                <div className={`ml-auto w-8 h-4 rounded-full transition-colors ${isDelivery ? "bg-primary" : "bg-muted"}`}>
                  <div className={`w-3 h-3 rounded-full bg-white mt-0.5 transition-all ${isDelivery ? "ml-4.5" : "ml-0.5"}`} />
                </div>
              </div>
              <AnimatePresence>
                {isDelivery && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-2 overflow-hidden">
                    <div className="space-y-1">
                      <Input
                        placeholder={`${t("deliveries.address")} *`}
                        value={deliveryAddress}
                        onChange={(e) => { setDeliveryAddress(e.target.value); if (e.target.value.trim()) setAddressError(false); }}
                        className={addressError ? "border-destructive" : ""}
                      />
                      {addressError && <p className="text-xs text-destructive">{t("sales.address_required")}</p>}
                    </div>
                    <Input placeholder={t("deliveries.phone")} value={deliveryPhone} onChange={(e) => setDeliveryPhone(e.target.value)} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Totals */}
              <div className="border-t border-border pt-3 space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{t("sales.subtotal")}</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <span>{t("sales.discount")}</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>{t("sales.total")}</span>
                  <span className="text-primary">{formatCurrency(total)}</span>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleSubmit}
                disabled={createSale.isPending || cart.length === 0}
              >
                {createSale.isPending ? t("sales.processing") : t("sales.confirm_sale")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <BarcodeScanner
        open={scannerOpen}
        prefix={skuPrefix}
        onScan={handleScan}
        onClose={() => setScannerOpen(false)}
      />
    </PageWrapper>
  );
}
