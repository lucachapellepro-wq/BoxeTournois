import type React from "react";

/**
 * Helpers UI réutilisables
 */

/** Extrait le premier nombre d'une chaîne (ex: "Mouche (48-52kg)" → 48) */
export function extractWeight(s: string): number {
  const m = s.match(/(\d+)/);
  return m ? parseInt(m[1]) : 0;
}

/** Comparateur pour trier des catégories par poids */
export function sortByWeight(a: string, b: string): number {
  return extractWeight(a) - extractWeight(b);
}

/** Formate une date ISO en format français lisible */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Année courante UTC — fonction pour éviter une constante module-level stale */
export function getCurrentYear(): number {
  return new Date().getUTCFullYear();
}

/** Style inline pour un badge coloré par la couleur du club */
export function clubColorStyle(couleur: string | null | undefined): React.CSSProperties | undefined {
  if (!couleur) return undefined;
  return {
    backgroundColor: `${couleur}20`,
    color: couleur,
    borderColor: `${couleur}40`,
  };
}
