import { useState, useCallback, useRef, useEffect } from "react";

/** Action cliquable affichée dans un toast (ex: "Annuler") */
export interface ToastAction {
  label: string;
  onClick: () => void;
}

/** État interne du toast (message, visibilité, action optionnelle) */
export interface ToastState {
  message: string;
  type: "success" | "error";
  visible: boolean;
  action?: ToastAction;
}

/** Hook de gestion des notifications toast avec auto-dismiss et action optionnelle */
export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    message: "",
    type: "success",
    visible: false,
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

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
