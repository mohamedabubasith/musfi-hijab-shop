import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

function FloatingHijabSVG() {
  return (
    <motion.svg
      width="160" height="160" viewBox="0 0 160 160" fill="none"
      animate={{ y: [0, -16, 0], rotate: [0, 3, -3, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Hijab outline illustration */}
      <ellipse cx="80" cy="90" rx="55" ry="40" fill="#e9d5ff" stroke="#7c3aed" strokeWidth="2" />
      <path d="M25 90 Q30 55 80 45 Q130 55 135 90" fill="#ddd6fe" stroke="#7c3aed" strokeWidth="2" />
      <ellipse cx="80" cy="50" rx="28" ry="28" fill="#f3e8ff" stroke="#7c3aed" strokeWidth="2" />
      {/* Face */}
      <ellipse cx="80" cy="50" rx="20" ry="22" fill="#fde68a" />
      <circle cx="74" cy="48" r="2.5" fill="#374151" />
      <circle cx="86" cy="48" r="2.5" fill="#374151" />
      <path d="M74 56 Q80 60 86 56" stroke="#374151" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Fabric flowing */}
      <path d="M25 90 Q10 110 20 130 Q40 145 60 135" stroke="#7c3aed" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M135 90 Q150 110 140 130 Q120 145 100 135" stroke="#7c3aed" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Stars */}
      <motion.circle cx="30" cy="30" r="3" fill="#7c3aed"
        animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0 }} />
      <motion.circle cx="130" cy="25" r="2" fill="#a855f7"
        animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.7 }} />
      <motion.circle cx="145" cy="60" r="2.5" fill="#7c3aed"
        animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1.4 }} />
    </motion.svg>
  );
}

const letterVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, type: "spring" } }),
};

export default function NotFoundPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dot-pattern flex items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-md">
        <FloatingHijabSVG />

        {/* 404 with stagger */}
        <div className="flex justify-center gap-1">
          {"404".split("").map((char, i) => (
            <motion.span
              key={i} custom={i} variants={letterVariants} initial="hidden" animate="visible"
              className="text-7xl font-black text-primary"
            >
              {char}
            </motion.span>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <h2 className="text-xl font-bold text-gray-800">{t("errors.not_found")}</h2>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-gray-500">
          {t("errors.not_found_sub")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, type: "spring" }}
        >
          <Button onClick={() => navigate("/")} size="lg" className="gap-2">
            <Home className="w-4 h-4" />
            {t("errors.go_home")}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
