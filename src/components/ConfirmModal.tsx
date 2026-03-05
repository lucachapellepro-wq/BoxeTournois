"use client";

import { useId } from "react";
import { useBottomSheetDrag } from "@/hooks/useBottomSheetDrag";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useEscapeKey } from "@/hooks/useEscapeKey";

interface ConfirmModalProps {
  show: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  id?: string;
}

/** Modal de confirmation mobile-friendly (remplace window.confirm) */
export function ConfirmModal({
  show,
  title,
  message,
  confirmLabel = "Confirmer",
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
  id,
}: ConfirmModalProps) {
  const { modalRef, onTouchStart, onTouchMove, onTouchEnd } = useBottomSheetDrag(onCancel);
  useBodyScrollLock(show);
  useEscapeKey(show, onCancel);
  const reactId = useId();
  const titleId = `${id || reactId}-title`;

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal modal-sm"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="modal-handle" />
        <div className="modal-header">
          <h2 id={titleId} className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onCancel} aria-label="Fermer">
            ✕
          </button>
        </div>
        <p className="modal-description">{message}</p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onCancel} disabled={loading}>
            Annuler
          </button>
          <button
            className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
