import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDeliveries, useUpdateDeliveryStatus } from "@/api/hooks";
import type { Delivery } from "@/types";

const STATUSES = ["pending", "packed", "in_transit", "delivered", "returned"] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-700/50",
  packed: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700/50",
  in_transit: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-700/50",
  delivered: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700/50",
  returned: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700/50",
};

function DeliveryCard({ delivery }: { delivery: Delivery }) {
  const { t } = useTranslation();
  const update = useUpdateDeliveryStatus();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-lg p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-sm">{delivery.customer_name}</p>
          {delivery.phone && <p className="text-xs text-muted-foreground">{delivery.phone}</p>}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[delivery.status]}`}>
          {t(`deliveries.${delivery.status}`)}
        </span>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2">{delivery.address}</p>
      {delivery.expected_date && (
        <p className="text-xs text-muted-foreground">Expected: {delivery.expected_date}</p>
      )}
      <Select
        value={delivery.status}
        onValueChange={(v) => update.mutate({ id: delivery.id, data: { status: v } })}
      >
        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`deliveries.${s}`)}</SelectItem>)}
        </SelectContent>
      </Select>
    </motion.div>
  );
}

export default function DeliveriesPage() {
  const { t } = useTranslation();
  const { data } = useDeliveries();
  const deliveries = data?.items || [];

  const byStatus = STATUSES.reduce((acc, s) => {
    acc[s] = deliveries.filter((d) => d.status === s);
    return acc;
  }, {} as Record<string, Delivery[]>);

  return (
    <PageWrapper title={t("deliveries.title")}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {STATUSES.slice(0, -1).map((status) => (
          <div key={status} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">{t(`deliveries.${status}`)}</h3>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{byStatus[status]?.length || 0}</span>
            </div>
            <div className="space-y-2">
              {(byStatus[status] || []).map((d) => <DeliveryCard key={d.id} delivery={d} />)}
              {(!byStatus[status] || byStatus[status].length === 0) && (
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground">{t("common.no_data")}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
}
