"use client";

import { useRef, useCallback, useState } from "react";

/**
 * Hook for adding swipe-to-delete on mobile table rows (cards).
 * Returns touch handlers and state to attach to a <tr>.
 */
export function useSwipeRow(onDelete: () => void) {
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const swiping = useRef(false);
  const rowRef = useRef<HTMLTableRowElement>(null);
  const [revealed, setRevealed] = useState(false);

  const THRESHOLD = 80;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    currentX.current = 0;
    swiping.current = false;
    if (rowRef.current) {
      rowRef.current.style.transition = "none";
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    // If mostly vertical, ignore (let scroll happen)
    if (!swiping.current && Math.abs(dy) > Math.abs(dx)) return;

    // Only allow left swipe
    if (dx < -10) {
      swiping.current = true;
      const offset = Math.max(-100, dx);
      currentX.current = offset;
      if (rowRef.current) {
        rowRef.current.style.transform = `translateX(${offset}px)`;
      }
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!swiping.current) return;

    if (rowRef.current) {
      rowRef.current.style.transition = "transform 0.25s ease";
    }

    if (currentX.current < -THRESHOLD) {
      if (rowRef.current) {
        rowRef.current.style.transform = "translateX(-90px)";
      }
      setRevealed(true);
    } else {
      if (rowRef.current) {
        rowRef.current.style.transform = "translateX(0)";
      }
      setRevealed(false);
    }
    swiping.current = false;
  }, []);

  const reset = useCallback(() => {
    if (rowRef.current) {
      rowRef.current.style.transition = "transform 0.25s ease";
      rowRef.current.style.transform = "translateX(0)";
    }
    setRevealed(false);
  }, []);

  const handleDelete = useCallback(() => {
    onDelete();
    reset();
  }, [onDelete, reset]);

  return {
    rowRef,
    revealed,
    touchHandlers: { onTouchStart, onTouchMove, onTouchEnd },
    handleDelete,
    reset,
  };
}
