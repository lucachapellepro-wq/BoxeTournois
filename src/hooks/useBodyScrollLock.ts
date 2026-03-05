import { useEffect } from "react";

const LOCK_ATTR = "data-scroll-locks";

/** Empêche le scroll du body quand `locked` est true (modal ouverte).
 *  Gère le stacking : le scroll n'est restauré que quand tous les verrous sont relâchés.
 *  Utilise un data attribute au lieu d'un compteur module-level pour résister au HMR. */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const count = parseInt(document.body.getAttribute(LOCK_ATTR) || "0", 10);
    document.body.setAttribute(LOCK_ATTR, String(count + 1));
    if (count === 0) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      const current = parseInt(document.body.getAttribute(LOCK_ATTR) || "1", 10);
      const next = current - 1;
      if (next <= 0) {
        document.body.removeAttribute(LOCK_ATTR);
        document.body.style.overflow = "";
      } else {
        document.body.setAttribute(LOCK_ATTR, String(next));
      }
    };
  }, [locked]);
}
