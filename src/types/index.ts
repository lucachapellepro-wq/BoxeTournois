export interface Club {
  id: number;
  nom: string;
  ville: string;
}

export interface Boxeur {
  id: number;
  nom: string;
  prenom: string;
  dateNaissance: string | null; // ISO string from API
  sexe: string;
  poids: number;
  gant: string;
  categoriePoids: string;
  categorieAge: string;
  club: Club;
  infoIncomplete: boolean; // Marque manuelle d'info incomplète (obligatoire)
}

// Helper pour extraire l'année d'une date
export function getAnneeFromDate(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return new Date(dateStr).getFullYear();
}
