import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { KeyRound, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/api/client";
import { MusfiLogo } from "@/components/MusfiLogo";

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError(t("auth.reset_mismatch"));
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/auth/reset-password", { token, new_password: newPassword });
      setSuccess(true);
    } catch (err: any) {
      const msg = err?.response?.data?.detail?.message;
      setError(msg || t("auth.reset_invalid"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen gradient-bg dot-pattern flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-foreground font-medium">{t("auth.reset_invalid")}</p>
          <Button className="mt-6 w-full" onClick={() => navigate("/login")}>
            {t("auth.reset_go_login")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg dot-pattern flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="flex justify-center mb-8"
        >
          <MusfiLogo size={96} className="rounded-full shadow-2xl" />
        </motion.div>

        <div className="bg-card rounded-2xl shadow-2xl p-8">
          {success ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">{t("auth.reset_success")}</h2>
              <p className="text-sm text-muted-foreground mb-6">{t("auth.reset_success_body")}</p>
              <Button className="w-full" onClick={() => navigate("/login")}>
                {t("auth.reset_go_login")}
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="font-semibold text-foreground">{t("auth.reset_password_title")}</h1>
                  <p className="text-xs text-muted-foreground">{t("auth.reset_password_body")}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">{t("auth.reset_new_password")}</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">{t("auth.reset_confirm_password")}</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <Button type="submit" className="w-full" disabled={submitting || !newPassword || !confirmPassword}>
                  {submitting ? t("auth.reset_submitting") : t("auth.reset_submit")}
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-white/50 text-xs mt-6">Musfi Hijab Shop © 2025</p>
      </motion.div>
    </div>
  );
}
