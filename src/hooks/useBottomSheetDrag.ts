import { useRef, useCallback } from "react";

/**
 * Hook pour ajouter le drag-to-dismiss sur les bottom sheet modals (mobile).
 * Ne se déclenche que si le contenu est scrollé tout en haut (scrollTop === 0),
 * pour éviter les conflits avec le scroll du contenu du modal.
 */
export function useBottomSheetDrag(onClose: () => void) {
  const startY = useRef(0);
  const currentY = useRef(0);
  const dragging = useRef(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    currentY.current = 0;
    dragging.current = false;

    // Only allow drag if modal-body is scrolled to top (or target is outside modal-body)
    const modalBody = modalRef.current?.querySelector(".modal-body") as HTMLElement | null;
    const isInsideBody = modalBody && modalBody.contains(e.target as Node);
    if (isInsideBody && modalBody.scrollTop > 0) {
      // Content is scrolled down, don't start drag
      dragging.current = false;
      return;
    }

    dragging.current = true;
    if (modalRef.current) {
      modalRef.current.style.transition = "none";
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging.current) return;

    const deltaY = e.touches[0].clientY - startY.current;
    // Only allow dragging downward
    if (deltaY > 0) {
      currentY.current = deltaY;
      if (modalRef.current) {
        modalRef.current.style.transform = `translateY(${deltaY}px)`;
        const opacity = Math.max(0.3, 1 - deltaY / 400);
        const overlay = modalRef.current.parentElement;
        if (overlay) overlay.style.opacity = String(opacity);
      }
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!dragging.current) return;

    if (modalRef.current) {
      modalRef.current.style.transition = "transform 0.25s ease";
      const overlay = modalRef.current.parentElement;
      if (overlay) overlay.style.transition = "opacity 0.25s ease";

      if (currentY.current > 150) {
        // Dismiss
        modalRef.current.style.transform = "translateY(100%)";
        if (overlay) overlay.style.opacity = "0";
        setTimeout(onClose, 200);
      } else {
        // Snap back
        modalRef.current.style.transform = "translateY(0)";
        if (overlay) overlay.style.opacity = "1";
      }
    }
    currentY.current = 0;
    dragging.current = false;
  }, [onClose]);

  return { modalRef, onTouchStart, onTouchMove, onTouchEnd };
}
