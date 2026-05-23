import { useEffect } from "react";
import { motion } from "framer-motion";
import { useUIStore } from "@/stores/uiStore";

interface Props {
  title?: string;
  children: React.ReactNode;
}

export function PageWrapper({ title, children }: Props) {
  const setPageTitle = useUIStore((s) => s.setPageTitle);

  useEffect(() => {
    setPageTitle(title || "");
  }, [title, setPageTitle]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex-1 overflow-y-auto p-4 md:p-6"
    >
      {children}
    </motion.div>
  );
}
