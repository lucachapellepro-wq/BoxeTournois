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
  });
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

/** Calcule l'âge à partir d'une date de naissance ISO */
export function calculateAge(dateNaissance: string | null): number | string {
  if (!dateNaissance) return "?";
  const today = new Date();
  const birthDate = new Date(dateNaissance);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}
