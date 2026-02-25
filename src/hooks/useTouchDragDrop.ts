import { useRef, useCallback, useState } from "react";

/**
 * Hook for touch-based drag & drop on mobile.
 * Falls back alongside HTML5 drag events (which handle desktop).
 */
export function useTouchDragDrop(
  items: unknown[],
  onReorder: (fromIndex: number, toIndex: number) => void
) {
  const [touchDragIndex, setTouchDragIndex] = useState<number | null>(null);
  const [touchOverIndex, setTouchOverIndex] = useState<number | null>(null);
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
    setTouchDragIndex(index);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchDragIndex === null) return;

    const dy = Math.abs(e.touches[0].clientY - startY.current);
    if (dy > 10) isDragging.current = true;
    if (!isDragging.current) return;

    // Find which row the finger is over
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
      setTouchOverIndex(closest);
    }
  }, [touchDragIndex]);

  const onTouchEnd = useCallback(() => {
    if (isDragging.current && touchDragIndex !== null && touchOverIndex !== null && touchDragIndex !== touchOverIndex) {
      onReorder(touchDragIndex, touchOverIndex);
    }
    setTouchDragIndex(null);
    setTouchOverIndex(null);
    isDragging.current = false;
  }, [touchDragIndex, touchOverIndex, onReorder]);

  return {
    touchDragIndex,
    touchOverIndex,
    setRowRef,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}
