import { useState, useCallback, useRef } from "react";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastState {
  message: string;
  type: "success" | "error";
  visible: boolean;
  action?: ToastAction;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    message: "",
    type: "success",
    visible: false,
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast((prev) => ({ ...prev, visible: false, action: undefined }));
  }, []);

  const showToast = useCallback(
    (
      message: string,
      type: "success" | "error" = "success",
      options?: { action?: ToastAction; duration?: number }
    ) => {
      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      const duration = options?.duration ?? (options?.action ? 8000 : 3000);

      setToast({ message, type, visible: true, action: options?.action });
      timerRef.current = setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false, action: undefined }));
        timerRef.current = null;
      }, duration);
    },
    []
  );

  return {
    toast,
    showToast,
    hideToast,
  };
}
