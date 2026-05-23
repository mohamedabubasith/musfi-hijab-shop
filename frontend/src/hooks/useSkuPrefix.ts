import { useState, useCallback } from "react";

const STORAGE_KEY = "musfi_sku_prefix";
const DEFAULT_PREFIX = "MUS";

export function getSkuPrefix(): string {
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_PREFIX;
}

export function saveSkuPrefix(prefix: string): void {
  const trimmed = prefix.trim().toUpperCase();
  if (trimmed) localStorage.setItem(STORAGE_KEY, trimmed);
}

export function useSkuPrefix() {
  const [prefix, setPrefix] = useState<string>(getSkuPrefix);

  const updatePrefix = useCallback((value: string) => {
    const trimmed = value.trim().toUpperCase();
    if (!trimmed) return;
    saveSkuPrefix(trimmed);
    setPrefix(trimmed);
  }, []);

  return { prefix, updatePrefix };
}
