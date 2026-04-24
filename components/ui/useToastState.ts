import { useCallback, useState } from "react";
import type { ToastData } from "@/components/ui/Toast";

function uniqueId(): number {
  return Date.now() * 1000 + Math.floor(Math.random() * 1000);
}

export function useToastState() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((message: string, type: ToastData["type"] = "success") => {
    const id = uniqueId();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return { toasts, addToast, dismissToast };
}
