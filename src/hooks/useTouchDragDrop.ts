import { useRef, useCallback, useState } from "react";

/**
 * Hook for touch-based drag & drop on mobile.
 * Uses refs for drag indices to avoid stale closures in touch handlers.
 */
export function useTouchDragDrop(
  onReorder: (fromIndex: number, toIndex: number) => void
) {
  const [touchDragIndex, setTouchDragIndex] = useState<number | null>(null);
  const [touchOverIndex, setTouchOverIndex] = useState<number | null>(null);
  const touchDragRef = useRef<number | null>(null);
  const touchOverRef = useRef<number | null>(null);
  const startY = useRef(0);
  const isDragging = useRef(false);
  const rowRefs = useRef<Map<number, HTMLElement>>(new Map());

  const setRowRef = useCallback((index: number, el: HTMLElement | null) => {
    if (el) rowRefs.current.set(index, el);
    else rowRefs.current.delete(index);
  }, []);

  const onTouchStart = useCallback((index: number, e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    isDragging.current = false;
    touchDragRef.current = index;
    setTouchDragIndex(index);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchDragRef.current === null) return;

    const dy = Math.abs(e.touches[0].clientY - startY.current);
    if (dy > 10) isDragging.current = true;
    if (!isDragging.current) return;

    const touchY = e.touches[0].clientY;
    let closest: number | null = null;
    let closestDist = Infinity;

    rowRefs.current.forEach((el, idx) => {
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const dist = Math.abs(touchY - center);
      if (dist < closestDist) {
        closestDist = dist;
        closest = idx;
      }
    });

    if (closest !== null) {
      touchOverRef.current = closest;
      setTouchOverIndex(closest);
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (isDragging.current && touchDragRef.current !== null && touchOverRef.current !== null && touchDragRef.current !== touchOverRef.current) {
      onReorder(touchDragRef.current, touchOverRef.current);
    }
    touchDragRef.current = null;
    touchOverRef.current = null;
    setTouchDragIndex(null);
    setTouchOverIndex(null);
    isDragging.current = false;
  }, [onReorder]);

  return {
    touchDragIndex,
    touchOverIndex,
    setRowRef,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}
