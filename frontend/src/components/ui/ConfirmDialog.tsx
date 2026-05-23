import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel,
  loading,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <DialogTitle>{title || t("common.confirm_delete")}</DialogTitle>
          </div>
        </DialogHeader>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 ml-1">{description}</p>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {confirmLabel || t("common.delete")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
