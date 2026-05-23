import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Globe, X, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/api/client";
import { useAuthStore } from "@/stores/authStore";
import { MusfiLogo } from "@/components/MusfiLogo";
import { toast } from "@/lib/toast";
import { useState } from "react";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSending, setForgotSending] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      const res = await api.post("/auth/login", data);
      setAuth(res.data.user, res.data.access_token);
      navigate("/");
    } catch {
      const msg = t("auth.invalid_credentials");
      setError(msg);
      toast.error(msg);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotSending(true);
    try {
      await api.post("/auth/forgot-password", { email: forgotEmail });
    } catch {
      // Always show success — don't leak user existence
    } finally {
      setForgotSending(false);
      setForgotSent(true);
    }
  };

  const closeForgot = () => {
    setShowForgot(false);
    setForgotEmail("");
    setForgotSent(false);
  };

  const toggleLang = () => {
    const next = i18n.language === "en" ? "ta" : "en";
    i18n.changeLanguage(next);
    localStorage.setItem("lang", next);
  };

  return (
    <div className="min-h-screen gradient-bg dot-pattern flex items-center justify-center p-4 relative">
      {/* Lang toggle */}
      <button
        onClick={toggleLang}
        className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm transition-colors"
      >
        <Globe className="w-4 h-4" />
        {i18n.language === "en" ? "தமிழ்" : "EN"}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="flex justify-center mb-8"
        >
          <MusfiLogo size={96} className="rounded-full shadow-2xl" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-bold text-white">{t("auth.welcome")}</h1>
          <p className="text-white/70 text-sm mt-1">{t("auth.subtitle")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl shadow-2xl p-8"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" type="email" placeholder="admin@musfishop.com" {...register("email")} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-xs text-primary hover:underline"
                >
                  {t("auth.forgot_password")}
                </button>
              </div>
              <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg"
              >
                {error}
              </motion.p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t("auth.signing_in") : t("auth.sign_in")}
            </Button>
          </form>
        </motion.div>

        <p className="text-center text-white/50 text-xs mt-6">Musfi Hijab Shop © 2025</p>
      </motion.div>

      {/* Forgot password modal */}
      <AnimatePresence>
        {showForgot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeForgot}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl shadow-2xl p-6 w-full max-w-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="font-semibold text-foreground">{t("auth.forgot_password_title")}</h2>
                </div>
                <button
                  onClick={closeForgot}
                  className="p-1 hover:bg-accent rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {forgotSent ? (
                <div className="text-center py-2">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-3">
                    <Mail className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{t("auth.forgot_success")}</h3>
                  <p className="text-sm text-muted-foreground">{t("auth.forgot_success_body")}</p>
                  <Button className="w-full mt-5" onClick={closeForgot}>
                    {t("common.close")}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <p className="text-sm text-muted-foreground">{t("auth.forgot_password_body")}</p>
                  <Input
                    type="email"
                    placeholder={t("auth.forgot_email_placeholder")}
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    autoFocus
                  />
                  <Button type="submit" className="w-full" disabled={forgotSending || !forgotEmail.trim()}>
                    {forgotSending ? t("auth.forgot_sending") : t("auth.forgot_send")}
                  </Button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
