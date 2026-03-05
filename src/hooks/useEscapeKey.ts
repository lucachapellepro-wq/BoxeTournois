import { useEffect, useRef } from "react";

/** Pile globale de handlers Escape — seul le dernier enregistré répond */
const escapeStack: Array<() => void> = [];

/** Ferme un modal/overlay lorsque la touche Escape est pressée.
 *  Gère le stacking : seul le handler le plus récent est appelé. */
export function useEscapeKey(active: boolean, onEscape: () => void) {
  const callbackRef = useRef(onEscape);
  callbackRef.current = onEscape;

  useEffect(() => {
    if (!active) return;

    const handler = () => callbackRef.current();
    escapeStack.push(handler);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && escapeStack.length > 0) {
        // Seul le dernier handler de la pile répond
        const top = escapeStack[escapeStack.length - 1];
        if (top === handler) {
          top();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      const idx = escapeStack.indexOf(handler);
      if (idx >= 0) escapeStack.splice(idx, 1);
    };
  }, [active]);
}
