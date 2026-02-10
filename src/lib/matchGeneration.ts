import { Boxeur } from "@/types";
import { MatchCreateData, CategoryInfo, BracketRound } from "@/types/match";

// =============================================
// HELPERS : Création de matchs
// =============================================

/** Crée un match de type BRACKET */
function createBracketMatch(
  tournoiId: number,
  category: CategoryInfo,
  boxeur1Id: number | null,
  boxeur2Id: number | null,
  round: BracketRound,
  position: number,
  order: number
): MatchCreateData {
  return {
    tournoiId,
    boxeur1Id,
    boxeur2Id,
    matchType: "BRACKET",
    sexe: category.sexe,
    categorieAge: category.categorieAge,
    categoriePoids: category.categoriePoids,
    gant: category.gant,
    categoryDisplay: category.categoryDisplay,
    bracketRound: round,
    bracketPosition: position,
    displayOrder: order,
  };
}

/** Crée un match de type POOL */
function createPoolMatch(
  tournoiId: number,
  category: CategoryInfo,
  boxeur1Id: number | null,
  boxeur2Id: number | null,
  poolName: string,
  order: number
): MatchCreateData {
  return {
    tournoiId,
    boxeur1Id,
    boxeur2Id,
    matchType: "POOL",
    sexe: category.sexe,
    categorieAge: category.categorieAge,
    categoriePoids: category.categoriePoids,
    gant: category.gant,
    categoryDisplay: category.categoryDisplay,
    poolName,
    displayOrder: order,
  };
}

/** Génère un round-robin (tous vs tous) pour une poule */
function generateRoundRobin(
  boxers: Boxeur[],
  category: CategoryInfo,
  tournoiId: number,
  poolName: string,
  startOrder: number
): MatchCreateData[] {
  const matches: MatchCreateData[] = [];
  let order = startOrder;

  for (let i = 0; i < boxers.length; i++) {
    for (let j = i + 1; j < boxers.length; j++) {
      matches.push(
        createPoolMatch(tournoiId, category, boxers[i].id, boxers[j].id, poolName, order++)
      );
    }
  }

  return matches;
}

// =============================================
// POINT D'ENTRÉE PRINCIPAL
// =============================================

/**
 * Génère tous les matchs pour un tournoi
 * Grouper par SEXE + CATÉGORIE DE POIDS (pas de mixité H/F)
 */
export function generateMatches(
  boxeurs: Boxeur[],
  tournoiId: number
): MatchCreateData[] {
  const matches: MatchCreateData[] = [];

  // Grouper par SEXE + CATÉGORIE DE POIDS
  const groups = new Map<string, Boxeur[]>();
  boxeurs.forEach((b) => {
    const key = `${b.sexe}|${b.categoriePoids}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(b);
  });

  // Pour chaque groupe, générer selon le nombre
  groups.forEach((groupBoxeurs, key) => {
    const [sexe, catPoids] = key.split("|");

    const category: CategoryInfo = {
      sexe,
      categorieAge: groupBoxeurs[0].categorieAge,
      categoriePoids: catPoids,
      gant: groupBoxeurs[0].gant,
      categoryDisplay: catPoids,
    };

    const count = groupBoxeurs.length;

    if (count === 1) {
      // 1 boxeur : finale seul
      matches.push(
        createBracketMatch(tournoiId, category, groupBoxeurs[0].id, null, BracketRound.FINAL, 0, 0)
      );
    } else if (count === 2) {
      // 2 boxeurs : 1 finale directe
      matches.push(...generate2(groupBoxeurs, category, tournoiId));
    } else if (count === 3) {
      // 3 boxeurs : poule de 3
      matches.push(...generate3(groupBoxeurs, category, tournoiId));
    } else if (count === 4) {
      // 4 boxeurs : 2 demis + finale TBD
      matches.push(...generate4(groupBoxeurs, category, tournoiId));
    } else if (count === 5) {
      // 5 boxeurs : 2 demis + 1 finale TBD (1 exempt par demi)
      matches.push(...generate5(groupBoxeurs, category, tournoiId));
    } else if (count === 6) {
      // 6 boxeurs : 2 poules de 3 + finale TBD
      matches.push(...generatePoolsWithFinal(groupBoxeurs, category, tournoiId));
    } else if (count === 7) {
      // 7 boxeurs : poule de 4 + poule de 3
      matches.push(...generateTwoPools(groupBoxeurs, category, tournoiId));
    } else if (count === 8) {
      // 8 boxeurs : quarts + demis TBD + finale TBD
      matches.push(...generate8(groupBoxeurs, category, tournoiId));
    } else {
      // > 8 boxeurs : poules automatiques
      matches.push(...generateLargePools(groupBoxeurs, category, tournoiId));
    }
  });

  return matches;
}

// =============================================
// STRATÉGIES DE GÉNÉRATION
// =============================================

/** 2 boxeurs : 1 finale */
function generate2(boxers: Boxeur[], cat: CategoryInfo, tid: number): MatchCreateData[] {
  return [createBracketMatch(tid, cat, boxers[0].id, boxers[1].id, BracketRound.FINAL, 0, 0)];
}

/** 3 boxeurs : poule round-robin */
function generate3(boxers: Boxeur[], cat: CategoryInfo, tid: number): MatchCreateData[] {
  return generateRoundRobin(boxers, cat, tid, "A", 0);
}

/** 4 boxeurs : 2 demis + 1 finale TBD */
function generate4(boxers: Boxeur[], cat: CategoryInfo, tid: number): MatchCreateData[] {
  const sorted = smartPairing(boxers);
  return [
    createBracketMatch(tid, cat, sorted[0].id, sorted[1].id, BracketRound.DEMI, 0, 0),
    createBracketMatch(tid, cat, sorted[2].id, sorted[3].id, BracketRound.DEMI, 1, 1),
    createBracketMatch(tid, cat, null, null, BracketRound.FINAL, 0, 2),
  ];
}

/** 5 boxeurs : poule de 3 + poule de 2 + 2 demis TBD + 1 finale TBD */
function generate5(boxers: Boxeur[], cat: CategoryInfo, tid: number): MatchCreateData[] {
  const sorted = smartPairing(boxers);
  const pouleA = generateRoundRobin(sorted.slice(0, 3), cat, tid, "A", 0);
  const pouleB = generateRoundRobin(sorted.slice(3, 5), cat, tid, "B", pouleA.length);
  const offset = pouleA.length + pouleB.length;
  return [
    ...pouleA,
    ...pouleB,
    createPoolMatch(tid, cat, null, null, "DEMI 1", offset),
    createPoolMatch(tid, cat, null, null, "DEMI 2", offset + 1),
    createPoolMatch(tid, cat, null, null, "FINALE", offset + 2),
  ];
}

/** 6 boxeurs : 2 poules de 3 + finale TBD */
function generatePoolsWithFinal(
  boxers: Boxeur[],
  cat: CategoryInfo,
  tid: number
): MatchCreateData[] {
  const mid = Math.ceil(boxers.length / 2);
  const pouleA = boxers.slice(0, mid);
  const pouleB = boxers.slice(mid);

  const matchesA = generateRoundRobin(pouleA, cat, tid, "A", 0);
  const matchesB = generateRoundRobin(pouleB, cat, tid, "B", matchesA.length);

  // Finale TBD
  const finale = createPoolMatch(tid, cat, null, null, "FINALE", matchesA.length + matchesB.length);

  return [...matchesA, ...matchesB, finale];
}

/** 7 boxeurs : poule de 4 + poule de 3 */
function generateTwoPools(
  boxers: Boxeur[],
  cat: CategoryInfo,
  tid: number
): MatchCreateData[] {
  const matchesA = generateRoundRobin(boxers.slice(0, 4), cat, tid, "A", 0);
  const matchesB = generateRoundRobin(boxers.slice(4, 7), cat, tid, "B", matchesA.length);
  return [...matchesA, ...matchesB];
}

/** 8 boxeurs : 4 quarts + 2 demis TBD + 1 finale TBD */
function generate8(boxers: Boxeur[], cat: CategoryInfo, tid: number): MatchCreateData[] {
  const sorted = smartPairing(boxers);
  const matches: MatchCreateData[] = [];

  // 4 Quarts
  for (let i = 0; i < 4; i++) {
    matches.push(
      createBracketMatch(tid, cat, sorted[i * 2].id, sorted[i * 2 + 1].id, BracketRound.QUART, i, i)
    );
  }

  // 2 Demis TBD
  for (let i = 0; i < 2; i++) {
    matches.push(createBracketMatch(tid, cat, null, null, BracketRound.DEMI, i, 4 + i));
  }

  // 1 Finale TBD
  matches.push(createBracketMatch(tid, cat, null, null, BracketRound.FINAL, 0, 6));

  return matches;
}

/** > 8 boxeurs : poules automatiques de 3-4 */
export function generateLargePools(
  boxers: Boxeur[],
  cat: CategoryInfo,
  tid: number
): MatchCreateData[] {
  const matches: MatchCreateData[] = [];
  const pools = divideIntoPools(boxers);

  pools.forEach((pool, poolIdx) => {
    const poolName = String.fromCharCode(65 + poolIdx); // A, B, C...
    matches.push(...generateRoundRobin(pool, cat, tid, poolName, matches.length));
  });

  return matches;
}

// =============================================
// UTILITAIRES
// =============================================

/** Appariement intelligent : varier âge, gant, club */
function smartPairing(boxers: Boxeur[]): Boxeur[] {
  return [...boxers].sort((a, b) => {
    if (a.categorieAge !== b.categorieAge) return a.categorieAge.localeCompare(b.categorieAge);
    if (a.gant !== b.gant) return a.gant.localeCompare(b.gant);
    return a.club.id - b.club.id;
  });
}

/** Divise les boxeurs en poules de 3-4 (snake draft) */
function divideIntoPools(boxers: Boxeur[]): Boxeur[][] {
  const numPools = Math.ceil(boxers.length / 4);
  const pools: Boxeur[][] = Array.from({ length: numPools }, () => []);

  boxers.forEach((boxer, idx) => {
    pools[idx % numPools].push(boxer);
  });

  return pools;
}

/** Retourne le nom du round en fonction du nombre total de rounds */
export function getRoundName(totalRounds: number, roundIndex: number): string {
  const allRounds = [BracketRound.HUITIEME, BracketRound.QUART, BracketRound.DEMI, BracketRound.FINAL];
  return allRounds[4 - totalRounds + roundIndex];
}

/** Lie les matchs d'un bracket avec nextMatchId */
export function linkBracketMatches(
  matches: Array<{ id: number; bracketRound: string | null; bracketPosition: number | null }>
): Array<{ id: number; nextMatchId: number | null }> {
  const updates: Array<{ id: number; nextMatchId: number | null }> = [];

  // Grouper par round
  const rounds = new Map<string, Array<{ id: number; bracketPosition: number }>>();
  matches.forEach((m) => {
    if (!m.bracketRound) return;
    if (!rounds.has(m.bracketRound)) rounds.set(m.bracketRound, []);
    rounds.get(m.bracketRound)!.push({ id: m.id, bracketPosition: m.bracketPosition! });
  });

  const roundOrder = [BracketRound.HUITIEME, BracketRound.QUART, BracketRound.DEMI, BracketRound.FINAL];

  // Lier chaque round au suivant
  for (let i = 0; i < roundOrder.length - 1; i++) {
    const currentMatches = rounds.get(roundOrder[i]);
    const nextMatches = rounds.get(roundOrder[i + 1]);
    if (!currentMatches || !nextMatches) continue;

    currentMatches.sort((a, b) => a.bracketPosition - b.bracketPosition);
    nextMatches.sort((a, b) => a.bracketPosition - b.bracketPosition);

    currentMatches.forEach((match, idx) => {
      updates.push({
        id: match.id,
        nextMatchId: nextMatches[Math.floor(idx / 2)]?.id || null,
      });
    });
  }

  return updates;
}
