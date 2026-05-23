export type ToastLevel = "success" | "error" | "info" | "warning";

export interface ToastPayload {
  level: ToastLevel;
  title: string;
  description?: string;
}

const EVENT = "app:toast";

function fire(level: ToastLevel, title: string, description?: string) {
  window.dispatchEvent(
    new CustomEvent<ToastPayload>(EVENT, { detail: { level, title, description } })
  );
}

export const toast = {
  success: (title: string, description?: string) => fire("success", title, description),
  error:   (title: string, description?: string) => fire("error",   title, description),
  info:    (title: string, description?: string) => fire("info",    title, description),
  warning: (title: string, description?: string) => fire("warning", title, description),
  EVENT,
};
