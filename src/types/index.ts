export interface Club {
  id: number;
  nom: string;
  coach: string | null;
  ville: string;
}

export interface Boxeur {
  id: number;
  nom: string;
  prenom: string;
  dateNaissance: string | null;
  sexe: string;
  poids: number;
  gant: string;
  categoriePoids: string;
  categorieAge: string;
  club: Club;
  infoIncomplete: boolean;
}

export interface Tournoi {
  id: number;
  nom: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  _count?: { boxeurs: number };
}

/** Tournoi avec ses boxeurs inclus (retourné par GET /api/tournois/[id]) */
export interface TournoiDetail extends Tournoi {
  boxeurs: Array<{
    tournoiId: number;
    boxeurId: number;
    boxeur: Boxeur;
  }>;
}

/** Valeur triable pour comparaison */
export type SortValue = string | number;

export function getAnneeFromDate(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return new Date(dateStr).getFullYear();
}
