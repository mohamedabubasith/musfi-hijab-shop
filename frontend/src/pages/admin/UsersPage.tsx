import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUsers, useCreateUser, useToggleUserActive } from "@/api/hooks";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
  sales: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  stock_manager: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
};

export default function UsersPage() {
  const { t } = useTranslation();
  const { data } = useUsers();
  const create = useCreateUser();
  const toggle = useToggleUserActive();
  const [formOpen, setFormOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<{ name: string; email: string; phone: string; password: string; role: string }>();

  const onSubmit = async (data: { name: string; email: string; phone: string; password: string; role: string }) => {
    await create.mutateAsync(data);
    reset();
    setFormOpen(false);
  };

  return (
    <PageWrapper title={t("users.title")}>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />{t("users.add_user")}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b">
              <tr>
                {[t("users.name"), t("users.email"), t("users.phone"), t("users.role"), t("users.status"), t("common.actions")].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(data?.items || []).map((user) => (
                <tr key={user.id} className="hover:bg-accent">
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.phone || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[user.role]}`}>
                      {t(`users.roles.${user.role}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.is_active
                      ? <Badge variant="success" className="text-xs">{t("users.active")}</Badge>
                      : <Badge variant="destructive" className="text-xs">{t("users.inactive")}</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => toggle.mutate(user.id)}>
                      {user.is_active ? t("users.deactivate") : t("users.activate")}
                    </Button>
                  </td>
                </tr>
              ))}
              {(!data?.items || data.items.length === 0) && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">{t("common.no_data")}</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("users.add_user")}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1"><Label>{t("users.name")} *</Label><Input {...register("name", { required: true })} /></div>
            <div className="space-y-1"><Label>{t("users.email")} *</Label><Input type="email" {...register("email", { required: true })} /></div>
            <div className="space-y-1"><Label>{t("users.phone")}</Label><Input {...register("phone")} /></div>
            <div className="space-y-1"><Label>Password *</Label><Input type="password" {...register("password", { required: true })} /></div>
            <div className="space-y-1">
              <Label>{t("users.role")} *</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" {...register("role", { required: true })}>
                <option value="admin">{t("users.roles.admin")}</option>
                <option value="sales">{t("users.roles.sales")}</option>
                <option value="stock_manager">{t("users.roles.stock_manager")}</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={isSubmitting}>{t("common.save")}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
