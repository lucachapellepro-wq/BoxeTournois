/**
 * Helpers pour la classification et l'affichage des matchs
 */
import { Match } from "@/types/match";
import { Boxeur } from "@/types";
import { sortByWeight } from "./ui-helpers";

// =============================================
// CLASSIFICATION DES MATCHS
// =============================================

export function isInterclub(m: Match): boolean {
  return (
    m.boxeur1?.typeCompetition === "INTERCLUB" ||
    m.boxeur2?.typeCompetition === "INTERCLUB" ||
    m.poolName === "INTERCLUB"
  );
}

export function isManuel(m: Match): boolean {
  return m.poolName === "MANUEL" || !!m.boxeur2Manual;
}

export function isMixte(m: Match): boolean {
  return m.poolName === "MIXTE";
}

export function isMixteOrManuel(m: Match): boolean {
  return isMixte(m) || isManuel(m);
}

export function isDemi(m: Match): boolean {
  return m.bracketRound === "DEMI" || (m.poolName?.startsWith("DEMI") ?? false);
}

export function isFinale(m: Match): boolean {
  return m.bracketRound === "FINAL" || m.poolName === "FINALE";
}

export function isPoule(m: Match): boolean {
  return m.matchType === "POOL" && !isDemi(m) && !isFinale(m) && m.poolName !== "MANUEL";
}

/** Match interclub au sens large (interclub, mixte ou manuel) */
export function isInterclubOrMixte(m: Match): boolean {
  return isInterclub(m) || isMixteOrManuel(m);
}

// =============================================
// COULEURS ET LABELS
// =============================================

/** Couleurs par type de match — alignées avec les CSS variables :root */
const MATCH_TYPE_COLORS = {
  manual: "#f97316",   // --manual
  mixte: "#14b8a6",    // --mixte
  interclub: "#f59e0b", // --interclub
  finale: "#ef4444",   // --danger
  demi: "#8b5cf6",     // --demi
  pool: "#22c55e",     // --pool-green
  elim: "#3b82f6",     // --elim-blue
} as const;

export function getMatchColor(match: Match): string {
  if (isManuel(match)) return MATCH_TYPE_COLORS.manual;
  if (isMixte(match)) return MATCH_TYPE_COLORS.mixte;
  if (isInterclub(match)) return MATCH_TYPE_COLORS.interclub;
  if (isFinale(match)) return MATCH_TYPE_COLORS.finale;
  if (isDemi(match)) return MATCH_TYPE_COLORS.demi;
  if (match.matchType === "POOL") return MATCH_TYPE_COLORS.pool;
  return MATCH_TYPE_COLORS.elim;
}

/** Returns a CSS class suffix for the match type badge */
export function getMatchTypeBadgeClass(match: Match): string {
  if (isManuel(match)) return "match-type-badge-manual";
  if (isMixte(match)) return "match-type-badge-mixte";
  if (isInterclub(match)) return "match-type-badge-interclub";
  if (isFinale(match)) return "match-type-badge-finale";
  if (isDemi(match)) return "match-type-badge-demi";
  if (match.matchType === "POOL") return "match-type-badge-pool";
  return "match-type-badge-elim";
}

export function getMatchLabel(match: Match): string {
  if (isManuel(match)) return "Manuel";
  if (isMixte(match)) return "Mixte";
  if (isInterclub(match)) return "Interclub";
  if (isFinale(match)) return "Finale";
  if (isDemi(match)) return "Demi";
  if (match.matchType === "POOL") return "Poule";
  return "Élim.";
}

export function getMatchLabelFull(match: Match): string {
  if (isManuel(match)) return "Combat ajouté";
  if (isMixte(match)) return "Interclub mixte";
  if (isInterclub(match)) return "Interclub";
  if (isFinale(match)) return "Finale";
  if (isDemi(match)) return "Demi-finale";
  if (match.matchType === "POOL") return "Poule";
  return "Élimination directe";
}

// =============================================
// VAINQUEURS DIRECTS
// =============================================

export type WinnerEntry = {
  boxeur: Boxeur;
  category: string;
  sexe: string;
  source: "solo" | "interclub";
};

/** Extrait les vainqueurs directs : boxeurs seuls + tireurs TOURNOI en interclub */
export function extractWinners(matches: Match[]): WinnerEntry[] {
  const result: WinnerEntry[] = [];

  // 1. Boxeurs seuls (match avec un seul boxeur) — exclure MANUEL partiels
  matches.forEach((m) => {
    if (isManuel(m)) return; // MANUEL partiel = match incomplet, pas un vainqueur
    if (m.boxeur1 && !m.boxeur2) {
      result.push({ boxeur: m.boxeur1, category: m.categoryDisplay || m.categoriePoids, sexe: m.sexe, source: "solo" });
    } else if (!m.boxeur1 && m.boxeur2) {
      result.push({ boxeur: m.boxeur2, category: m.categoryDisplay || m.categoriePoids, sexe: m.sexe, source: "solo" });
    }
  });

  // 2. Tireurs Tournoi dans les rencontres interclub/mixte (exclure manuels, solos, doublons)
  const seenIds = new Set(result.map((r) => r.boxeur.id));
  matches.forEach((m) => {
    if (!isInterclub(m) && !isMixte(m)) return;
    if (!m.boxeur1 || !m.boxeur2) return;
    if (m.boxeur1.typeCompetition === "TOURNOI" && !seenIds.has(m.boxeur1.id)) {
      seenIds.add(m.boxeur1.id);
      result.push({ boxeur: m.boxeur1, category: m.categoryDisplay || m.categoriePoids, sexe: m.sexe, source: "interclub" });
    }
    if (m.boxeur2.typeCompetition === "TOURNOI" && !seenIds.has(m.boxeur2.id)) {
      seenIds.add(m.boxeur2.id);
      result.push({ boxeur: m.boxeur2, category: m.categoryDisplay || m.categoriePoids, sexe: m.sexe, source: "interclub" });
    }
  });

  return result;
}

// =============================================
// GROUPEMENT PAR SEXE ET CATÉGORIE
// =============================================

export type SexeGrouped<T> = {
  F: Array<[string, T[]]>;
  M: Array<[string, T[]]>;
};

/** Groupe des éléments par sexe et catégorie, triés par poids */
export function groupBySexe<T>(
  items: T[],
  getSexe: (item: T) => string,
  getCategory: (item: T) => string,
): SexeGrouped<T> {
  const femmes = new Map<string, T[]>();
  const hommes = new Map<string, T[]>();

  items.forEach((item) => {
    const groups = getSexe(item) === "F" ? femmes : hommes;
    const cat = getCategory(item);
    if (!groups.has(cat)) {
      groups.set(cat, []);
    }
    groups.get(cat)!.push(item);
  });

  return {
    F: Array.from(femmes.entries()).sort(([a], [b]) => sortByWeight(a, b)),
    M: Array.from(hommes.entries()).sort(([a], [b]) => sortByWeight(a, b)),
  };
}

/** Groupe des matchs par sexe et categoryDisplay */
export function groupMatchesBySexe(matches: Match[]): SexeGrouped<Match> {
  return groupBySexe(matches, (m) => m.sexe, (m) => m.categoryDisplay);
}

/** Groupe des WinnerEntry par sexe et category */
export function groupWinnersBySexe(winners: WinnerEntry[]): SexeGrouped<WinnerEntry> {
  return groupBySexe(winners, (w) => w.sexe, (w) => w.category);
}
