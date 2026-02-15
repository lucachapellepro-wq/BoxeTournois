interface ToastProps {
  message: string;
  type: "success" | "error";
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function Toast({ message, type, action }: ToastProps) {
  return (
    <div className={`toast toast-${type}${action ? " toast-with-action" : ""}`}>
      <span>{message}</span>
      {action && (
        <button className="toast-action" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}
