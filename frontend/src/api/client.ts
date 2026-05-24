import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "@/lib/toast";

const BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
}

// URLs where we suppress automatic error toasts (handled inline by UI)
const SILENT_PATHS = ["/auth/login", "/auth/refresh", "/auth/reset-password", "/auth/forgot-password"];

function extractMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) return "An unexpected error occurred";
  const data = error.response?.data as Record<string, unknown> | undefined;
  if (typeof data?.message === "string") return data.message;
  if (typeof data?.detail === "string") return data.detail;
  if (data?.detail && typeof data.detail === "object" && !Array.isArray(data.detail)) {
    const d = data.detail as Record<string, unknown>;
    if (typeof d.message === "string") return d.message;
  }
  if (Array.isArray(data?.detail)) {
    const first = (data.detail as Array<{ msg?: string }>)[0];
    return first?.msg ?? "Validation error";
  }
  return error.message || "Something went wrong";
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // ── 401: attempt transparent token refresh (skip for login — let UI handle inline) ──
    const isLoginPath = original?.url?.includes("/auth/login");
    if (error.response?.status === 401 && !original._retry && !isLoginPath) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch((e) => Promise.reject(e));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh`,
          { refresh_token: "" },
          { withCredentials: true }
        );
        useAuthStore.getState().setToken(data.access_token);
        processQueue(null, data.access_token);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch (e) {
        processQueue(e, null);
        useAuthStore.getState().logout();
        toast.error("Session expired", "Please sign in again");
        window.location.href = "/login";
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    // ── Show toast for all other errors (skip silent paths) ──
    const isSilent = SILENT_PATHS.some((p) => original?.url?.includes(p));
    if (!isSilent) {
      const status = error.response?.status as number | undefined;
      const msg = extractMessage(error);

      if (status === 403) {
        toast.error("Access denied", "You don't have permission to do this");
      } else if (status === 409) {
        toast.error("Already exists", msg);
      } else if (status === 422 || status === 400) {
        toast.error("Validation error", msg);
      } else if (status && status >= 500) {
        toast.error("Server error", "Please try again later");
      } else if (!error.response) {
        toast.error("Connection error", "Check your network connection");
      } else if (status !== 404 && status !== 401) {
        toast.error(msg);
      }
    }

    return Promise.reject(error);
  }
);
