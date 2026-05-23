import { useEffect, useState } from "react";
import * as Toast from "@radix-ui/react-toast";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast as toastLib, type ToastPayload } from "@/lib/toast";

interface ToastItem extends ToastPayload { id: number; }

const ICONS = {
  success: <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />,
  error:   <AlertCircle  className="w-4 h-4 text-destructive flex-shrink-0" />,
  info:    <Info         className="w-4 h-4 text-blue-500 flex-shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />,
};

const TITLE_CLS = {
  success: "text-green-700 dark:text-green-400",
  error:   "text-destructive",
  info:    "text-blue-700 dark:text-blue-400",
  warning: "text-amber-700 dark:text-amber-400",
};

const BORDER_CLS = {
  success: "border-green-500/40",
  error:   "border-destructive/40",
  info:    "border-blue-500/40",
  warning: "border-amber-500/40",
};

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { level, title, description } = (e as CustomEvent<ToastPayload>).detail;
      setToasts((prev) => [...prev.slice(-4), { id: Date.now() + Math.random(), level, title, description }]);
    };
    window.addEventListener(toastLib.EVENT, handler);
    return () => window.removeEventListener(toastLib.EVENT, handler);
  }, []);

  const dismiss = (id: number) => setToasts((p) => p.filter((t) => t.id !== id));

  return (
    <Toast.Provider swipeDirection="right" duration={4500}>
      {toasts.map((t) => (
        <Toast.Root
          key={t.id}
          open
          onOpenChange={(open) => !open && dismiss(t.id)}
          className={cn(
            "flex items-start gap-3 rounded-lg p-4 shadow-lg border bg-background text-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-80 data-[state=open]:slide-in-from-bottom-3",
            "data-[swipe=end]:animate-out data-[state=closed]:slide-out-to-right-full",
            BORDER_CLS[t.level]
          )}
        >
          {ICONS[t.level]}
          <div className="flex-1 min-w-0">
            <Toast.Title className={cn("font-semibold leading-tight", TITLE_CLS[t.level])}>
              {t.title}
            </Toast.Title>
            {t.description && (
              <Toast.Description className="text-xs text-muted-foreground mt-0.5">
                {t.description}
              </Toast.Description>
            )}
          </div>
          <Toast.Close onClick={() => dismiss(t.id)} className="p-0.5 hover:bg-muted rounded flex-shrink-0">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </Toast.Close>
        </Toast.Root>
      ))}
      <Toast.Viewport className="fixed bottom-4 right-4 flex flex-col gap-2 w-[360px] z-[100] max-h-[calc(100vh-2rem)] outline-none" />
    </Toast.Provider>
  );
}
