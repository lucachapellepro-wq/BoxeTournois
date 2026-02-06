// =============================================
// CATÉGORIES SAVATE BOXE FRANÇAISE
// Basé sur le règlement FFSbf&DA 2025-2026
// =============================================

// Calcul de l'âge saison : année en cours - année de naissance
export function calculerAgeSaison(
  anneeNaissance: number | null,
): number | null {
  if (!anneeNaissance) return null;
  const anneeEnCours = new Date().getFullYear();
  return anneeEnCours - anneeNaissance;
}

// =============================================
// CATÉGORIES D'ÂGE
// =============================================
export function getCategorieAge(anneeNaissance: number | null): string {
  if (!anneeNaissance) return "—";
  const ageSaison = calculerAgeSaison(anneeNaissance);
  if (!ageSaison) return "—";

  if (ageSaison <= 9) return "Pré-poussins";
  if (ageSaison <= 11) return "Poussins";
  if (ageSaison <= 13) return "Benjamins";
  if (ageSaison <= 15) return "Minimes";
  if (ageSaison <= 17) return "Cadets";
  if (ageSaison <= 20) return "Juniors";
  if (ageSaison <= 34) return "Seniors";
  if (ageSaison <= 39) return "Vétérans Combat";
  return "Vétérans";
}

// =============================================
// GANTS DE COULEUR (grades techniques)
// =============================================
export const GANTS_COULEUR = [
  { value: "bleu", label: "Gant Bleu", color: "#3B82F6", degre: "1er degré" },
  { value: "vert", label: "Gant Vert", color: "#22C55E", degre: "2e degré" },
  { value: "rouge", label: "Gant Rouge", color: "#EF4444", degre: "3e degré" },
  { value: "blanc", label: "Gant Blanc", color: "#F8FAFC", degre: "4e degré" },
  { value: "jaune", label: "Gant Jaune", color: "#EAB308", degre: "5e degré" },

  {
    value: "bronze",
    label: "Gant de Bronze",
    color: "#CD7F32",
    degre: "Compétition",
  },
  {
    value: "argent",
    label: "Gant d'Argent",
    color: "#C0C0C0",
    degre: "Compétition",
  },
  { value: "or", label: "Gant d'Or", color: "#FFD700", degre: "Compétition" },
];

export function getGantLabel(gant: string): string {
  return GANTS_COULEUR.find((g) => g.value === gant)?.label || gant;
}

export function getGantColor(gant: string): string {
  return GANTS_COULEUR.find((g) => g.value === gant)?.color || "#888";
}

// =============================================
// CATÉGORIES DE POIDS — Jeunes (jusqu'à Cadet inclus)
// =============================================
const CATEGORIES_POIDS_JEUNES = [
  { max: 24, nom: "Moustique" },
  { max: 27, nom: "Pré-mini-mouche" },
  { max: 30, nom: "Pré-mini-coq" },
  { max: 33, nom: "Pré-mini-plume" },
  { max: 36, nom: "Pré-mini-léger" },
  { max: 39, nom: "Mini-mouche" },
  { max: 42, nom: "Mini-coq" },
  { max: 45, nom: "Mini-plume" },
  { max: 48, nom: "Mini-léger" },
  { max: 51, nom: "Mouche" },
  { max: 54, nom: "Coq" },
  { max: 57, nom: "Plume" },
  { max: 60, nom: "Super-plume" },
  { max: 63, nom: "Léger" },
  { max: 66, nom: "Super-léger" },
  { max: 70, nom: "Mi-moyen" },
  { max: 74, nom: "Super-mi-moyen" },
  { max: 79, nom: "Moyen" },
  { max: 85, nom: "Mi-lourd" },
  { max: Infinity, nom: "Lourd" },
];

// CATÉGORIES DE POIDS — Seniors Hommes (après Cadet)
const CATEGORIES_POIDS_HOMMES = [
  { max: 48, nom: "Mouche" },
  { max: 52, nom: "Coq" },
  { max: 56, nom: "Plume" },
  { max: 60, nom: "Léger" },
  { max: 65, nom: "Super-léger" },
  { max: 70, nom: "Mi-moyen" },
  { max: 75, nom: "Super-mi-moyen" },
  { max: 80, nom: "Moyen" },
  { max: 85, nom: "Mi-lourd" },
  { max: Infinity, nom: "Lourd" },
];

// CATÉGORIES DE POIDS — Seniors Femmes (après Cadet)
const CATEGORIES_POIDS_FEMMES = [
  { max: 48, nom: "Mouche" },
  { max: 52, nom: "Coq" },
  { max: 56, nom: "Plume" },
  { max: 60, nom: "Léger" },
  { max: 65, nom: "Super-léger" },
  { max: 70, nom: "Mi-moyen" },
  { max: 75, nom: "Super-mi-moyen" },
  { max: Infinity, nom: "Moyen" },
];

export function getCategoriePoids(
  poids: number,
  sexe: string,
  anneeNaissance: number | null,
): string {
  if (!anneeNaissance) return "—";
  const ageSaison = calculerAgeSaison(anneeNaissance);
  if (!ageSaison) return "—";
  const estJeune = ageSaison <= 17;

  let categories;
  if (estJeune) {
    categories = CATEGORIES_POIDS_JEUNES;
  } else if (sexe === "F") {
    categories = CATEGORIES_POIDS_FEMMES;
  } else {
    categories = CATEGORIES_POIDS_HOMMES;
  }

  const cat = categories.find((c) => poids <= c.max);
  if (!cat) return "Non classé";

  const idx = categories.indexOf(cat);
  const min = idx > 0 ? categories[idx - 1].max : 0;

  if (cat.max === Infinity) {
    return `${cat.nom} (+${min}kg)`;
  }
  return `${cat.nom} (${min}-${cat.max}kg)`;
}
