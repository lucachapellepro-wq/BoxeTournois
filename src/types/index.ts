/**
 * Types principaux de l'application — miroir des modèles Prisma côté client.
 */

/** Club de boxe savate */
export interface Club {
  id: number;
  nom: string;
  coach: string | null;
  ville: string;
  couleur: string | null;
}

/** Tireur (boxeur) inscrit à un club, avec catégories calculées */
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
  typeCompetition: string; // "TOURNOI" | "INTERCLUB"
  infoIncomplete: boolean;
}

/** Tournoi (liste) */
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

/** Extrait l'année depuis une date ISO (ou null) */
export function getAnneeFromDate(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return new Date(dateStr).getUTCFullYear();
}
