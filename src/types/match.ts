import { Boxeur } from "./index";

// Enums
export enum MatchType {
  BRACKET = "BRACKET",
  POOL = "POOL",
}

export enum BracketRound {
  HUITIEME = "HUITIEME",
  QUART = "QUART",
  DEMI = "DEMI",
  FINAL = "FINAL",
}

export enum MatchStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FORFEIT = "FORFEIT",
}

// Interface pour un match complet (depuis l'API)
export interface Match {
  id: number;
  tournoiId: number;

  // Participants
  boxeur1Id: number;
  boxeur1: Boxeur;
  boxeur2Id: number | null;
  boxeur2: Boxeur | null;

  // Type et catégorie
  matchType: string; // MatchType
  sexe: string; // "M" | "F"
  categorieAge: string;
  categoriePoids: string;
  gant: string;
  categoryDisplay: string;

  // Pour BRACKET
  bracketRound: string | null; // BracketRound
  bracketPosition: number | null;
  nextMatchId: number | null;
  nextMatch?: Match | null;
  previousMatches?: Match[];

  // Pour POOL
  poolName: string | null;

  // Résultat
  status: string; // MatchStatus
  winnerId: number | null;
  winner?: Boxeur | null;

  boxeur2Manual: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

// Interface pour créer un match
export interface MatchCreateData {
  tournoiId: number;
  boxeur1Id: number | null;
  boxeur2Id: number | null;
  matchType: string;
  sexe: string;
  categorieAge: string;
  categoriePoids: string;
  gant: string;
  categoryDisplay: string;
  bracketRound?: string | null;
  bracketPosition?: number | null;
  nextMatchId?: number | null;
  poolName?: string | null;
  displayOrder: number;
}

// Interface pour le résultat d'un match
export interface MatchResult {
  winnerId: number;
  status: string; // MatchStatus
}

// Interface pour les statistiques des matchs
export interface MatchStats {
  total: number;
  byType: {
    BRACKET: number;
    POOL: number;
  };
  byStatus: {
    PENDING: number;
    COMPLETED: number;
    FORFEIT: number;
  };
  categories: Array<{
    name: string;
    type: string;
    boxeurs: number;
    matches: number;
  }>;
}

// Info de catégorie pour la génération
export interface CategoryInfo {
  sexe: string;
  categorieAge: string;
  categoriePoids: string;
  gant: string;
  categoryDisplay: string;
}
