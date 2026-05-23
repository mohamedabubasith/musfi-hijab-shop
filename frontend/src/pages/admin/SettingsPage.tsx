import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Tag, Globe, Hash, Settings2, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAllShopConfigs, useCreateShopConfig, useDeleteShopConfig } from "@/api/hooks";
import { useSkuPrefix } from "@/hooks/useSkuPrefix";
import { toast } from "@/lib/toast";

type Tab = "category" | "origin" | "sku_prefix";

export default function SettingsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>("category");
  const { data, isLoading } = useAllShopConfigs();
  const create = useCreateShopConfig();
  const remove = useDeleteShopConfig();

  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");
  const { prefix, updatePrefix } = useSkuPrefix();
  const [prefixInput, setPrefixInput] = useState(prefix);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: "category" | "origin" } | null>(null);

  const items = activeTab === "category" ? (data?.categories || []) : (data?.origins || []);

  const handleAdd = async () => {
    const label = newLabel.trim();
    const value = newValue.trim() || label.toLowerCase().replace(/\s+/g, "_");
    if (!label) return;
    await create.mutateAsync({ type: activeTab as "category" | "origin", label, value });
    setNewLabel("");
    setNewValue("");
  };

  const tabs: { key: Tab; label: string; icon: React.ElementType; description: string }[] = [
    { key: "category", label: t("settings.categories"), icon: Tag, description: t("settings.category_desc") },
    { key: "origin", label: t("settings.origins"), icon: Globe, description: t("settings.origin_desc") },
    { key: "sku_prefix", label: t("settings.sku_prefix_tab"), icon: Hash, description: t("settings.sku_prefix_desc") },
  ];

  const activeTabInfo = tabs.find((t) => t.key === activeTab)!;

  return (
    <PageWrapper title={t("settings.title")}>
      {/* Mobile: horizontal tab bar */}
      <div className="flex sm:hidden gap-1 bg-muted p-1 rounded-lg mb-5 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex gap-6 max-w-4xl">

        {/* Sidebar — desktop only */}
        <aside className="hidden sm:block w-52 shrink-0 space-y-1">
          <div className="flex items-center gap-2 px-3 py-2 mb-3">
            <Settings2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("settings.title")}</span>
          </div>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Page header */}
          <div className="pb-4 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">{activeTabInfo.label}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{activeTabInfo.description}</p>
          </div>

          {/* SKU prefix panel */}
          {activeTab === "sku_prefix" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">{t("settings.sku_prefix_label")}</Label>
                  <p className="text-xs text-muted-foreground">{t("settings.sku_prefix_hint")}</p>
                  <div className="flex gap-3 mt-2">
                    <Input
                      value={prefixInput}
                      onChange={(e) => setPrefixInput(e.target.value.toUpperCase())}
                      placeholder="MUS"
                      className="font-mono uppercase w-40 text-lg font-bold tracking-widest"
                      maxLength={10}
                    />
                    <Button
                      onClick={() => { updatePrefix(prefixInput); toast.success(t("settings.prefix_saved")); }}
                      disabled={!prefixInput.trim()}
                    >
                      {t("settings.save_prefix")}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50 border border-border">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{t("settings.preview")}</span>
                  <span className="font-mono text-base font-bold text-primary tracking-wider">{prefixInput || "MUS"}-001</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Category / Origin list + add */}
          {activeTab !== "sku_prefix" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

              {/* List */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                {isLoading ? (
                  <div className="p-4 space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                    {activeTab === "category"
                      ? <Tag className="w-8 h-8 opacity-30" />
                      : <Globe className="w-8 h-8 opacity-30" />}
                    <p className="text-sm">{t("common.no_data")}</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {items.map((item, i) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }}
                        className={`flex items-center justify-between px-4 py-3 ${i < items.length - 1 ? "border-b border-border" : ""} hover:bg-accent/40 transition-colors group`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            {activeTab === "category"
                              ? <Tag className="w-3.5 h-3.5 text-primary" />
                              : <Globe className="w-3.5 h-3.5 text-primary" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{item.label}</p>
                            <p className="text-xs text-muted-foreground font-mono">{item.value}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                          onClick={() => setDeleteTarget({ id: item.id, type: item.type as "category" | "origin" })}
                          disabled={remove.isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              {/* Add new */}
              <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">
                  {activeTab === "category" ? t("settings.add_category") : t("settings.add_origin")}
                </h3>
                <div className="flex gap-3">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground">{t("settings.label")}</Label>
                    <Input
                      placeholder={activeTab === "category" ? "e.g. Premium Hijab" : "e.g. Turkey"}
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    />
                  </div>
                  <div className="w-36 space-y-1">
                    <Label className="text-xs text-muted-foreground">{t("settings.value_optional")}</Label>
                    <Input
                      placeholder="auto"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleAdd} disabled={!newLabel.trim() || create.isPending}>
                      <Plus className="w-4 h-4 mr-1.5" />
                      {t("settings.add")}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{t("settings.value_hint")}</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) remove.mutate(deleteTarget);
          setDeleteTarget(null);
        }}
        loading={remove.isPending}
      />
    </PageWrapper>
  );
}
