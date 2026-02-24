"use client";

import { createContext, useContext } from "react";
import { useToast, ToastAction } from "@/hooks/useToast";
import { Toast } from "@/components/Toast";

/** Type du contexte toast exposé aux pages */
interface ToastContextType {
  showToast: (
    message: string,
    type?: "success" | "error",
    options?: { action?: ToastAction; duration?: number }
  ) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

/** Provider global du toast : à placer dans le layout pour éviter de dupliquer le hook dans chaque page */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toast, showToast } = useToast();

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast.visible && (
        <Toast message={toast.message} type={toast.type} action={toast.action} />
      )}
    </ToastContext.Provider>
  );
}

/** Hook pour accéder au toast global depuis n'importe quel composant client */
export function useGlobalToast() {
  return useContext(ToastContext);
}
