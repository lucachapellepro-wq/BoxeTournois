import { Boxeur } from "@/types";
import { MatchCreateData, CategoryInfo, BracketRound } from "@/types/match";

// =============================================
// HELPERS : Création de matchs
// =============================================

/** Randomise l'ordre des coins (boxeur1/boxeur2) */
function randomizeCorners(id1: number | null, id2: number | null): [number | null, number | null] {
  if (id1 === null || id2 === null) return [id1, id2];
  return Math.random() < 0.5 ? [id1, id2] : [id2, id1];
}

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
  const [b1, b2] = randomizeCorners(boxeur1Id, boxeur2Id);
  return {
    tournoiId,
    boxeur1Id: b1,
    boxeur2Id: b2,
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
  const [b1, b2] = randomizeCorners(boxeur1Id, boxeur2Id);
  return {
    tournoiId,
    boxeur1Id: b1,
    boxeur2Id: b2,
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

  // Dédupliquer par ID pour éviter les auto-affrontements
  const seen = new Set<number>();
  const uniqueBoxeurs = boxeurs.filter((b) => {
    if (seen.has(b.id)) return false;
    seen.add(b.id);
    return true;
  });

  // Grouper par SEXE + CATÉGORIE DE POIDS + TYPE COMPETITION
  // Note : gant et categorieAge sont des métadonnées du match, pas des critères de séparation
  const groups = new Map<string, Boxeur[]>();
  uniqueBoxeurs.forEach((b) => {
    const key = `${b.sexe}|${b.categoriePoids}|${b.typeCompetition}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(b);
  });

  // Détecter les solos Tournoi ↔ Interclub pour les apparier
  // Clé : sexe|categoriePoids → { TOURNOI: key, INTERCLUB: key }
  const soloKeys = new Map<string, { tournoi: string; interclub: string }>();
  groups.forEach((groupBoxeurs, key) => {
    const [sexe, catPoids, typeCompetition] = key.split("|");
    if (groupBoxeurs.length === 1) {
      const baseKey = `${sexe}|${catPoids}`;
      if (!soloKeys.has(baseKey)) soloKeys.set(baseKey, { tournoi: "", interclub: "" });
      if (typeCompetition === "TOURNOI") soloKeys.get(baseKey)!.tournoi = key;
      if (typeCompetition === "INTERCLUB") soloKeys.get(baseKey)!.interclub = key;
    }
  });

  // Créer les matchs mixtes et retirer les solos appariés
  const pairedKeys = new Set<string>();
  soloKeys.forEach(({ tournoi, interclub }) => {
    if (tournoi && interclub) {
      const boxeurT = groups.get(tournoi)![0];
      const boxeurI = groups.get(interclub)![0];
      const category: CategoryInfo = {
        sexe: boxeurT.sexe,
        categorieAge: boxeurT.categorieAge,
        categoriePoids: boxeurT.categoriePoids,
        gant: boxeurT.gant,
        categoryDisplay: boxeurT.categoriePoids,
      };
      // Match mixte : Tournoi vs Interclub avec poolName "MIXTE"
      const mixteMatch = createBracketMatch(tournoiId, category, boxeurT.id, boxeurI.id, BracketRound.FINAL, 0, 0);
      mixteMatch.poolName = "MIXTE";
      matches.push(mixteMatch);
      pairedKeys.add(tournoi);
      pairedKeys.add(interclub);
    }
  });

  // Pour chaque groupe, générer selon le nombre
  groups.forEach((groupBoxeurs, key) => {
    // Skip les solos déjà appariés en mixte
    if (pairedKeys.has(key)) return;

    const [sexe, catPoids, typeCompetition] = key.split("|");

    // categorieAge et gant : prendre la valeur la plus fréquente du groupe
    const category: CategoryInfo = {
      sexe,
      categorieAge: mostFrequent(groupBoxeurs.map((b) => b.categorieAge)),
      categoriePoids: catPoids,
      gant: mostFrequent(groupBoxeurs.map((b) => b.gant)),
      categoryDisplay: catPoids,
    };

    const count = groupBoxeurs.length;

    // INTERCLUB : pas de tournoi, juste des matchs 1v1 simples
    if (typeCompetition === "INTERCLUB") {
      matches.push(...generateInterclub(groupBoxeurs, category, tournoiId));
      return;
    }

    // TOURNOI : structure complète avec brackets/poules
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

/** INTERCLUB : même structure que tournoi mais sans matchs provisoires (TBD) */
function generateInterclub(boxers: Boxeur[], cat: CategoryInfo, tid: number): MatchCreateData[] {
  const count = boxers.length;
  let matches: MatchCreateData[] = [];

  if (count === 1) {
    matches.push(createBracketMatch(tid, cat, boxers[0].id, null, BracketRound.FINAL, 0, 0));
  } else if (count === 2) {
    matches.push(...generate2(boxers, cat, tid));
  } else if (count === 3) {
    matches.push(...generate3(boxers, cat, tid));
  } else if (count === 4) {
    matches.push(...generate4(boxers, cat, tid));
  } else if (count === 5) {
    matches.push(...generate5(boxers, cat, tid));
  } else if (count === 6) {
    matches.push(...generatePoolsWithFinal(boxers, cat, tid));
  } else if (count === 7) {
    matches.push(...generateTwoPools(boxers, cat, tid));
  } else if (count === 8) {
    matches.push(...generate8(boxers, cat, tid));
  } else {
    matches.push(...generateLargePools(boxers, cat, tid));
  }

  // Filtrer les matchs provisoires (TBD) : supprimer ceux où les deux boxeurs sont null
  matches = matches.filter(m => m.boxeur1Id !== null || m.boxeur2Id !== null);

  return matches;
}

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

/** Appariement intelligent : séparer les boxeurs du même club */
function smartPairing(boxers: Boxeur[]): Boxeur[] {
  // Trier d'abord par club pour regrouper, puis distribuer en alternance
  const sorted = [...boxers].sort((a, b) => (a.club?.id ?? 0) - (b.club?.id ?? 0));
  const result: Boxeur[] = [];
  const remaining = [...sorted];

  // Snake draft : alterner les clubs pour maximiser la diversité
  while (remaining.length > 0) {
    const lastClubId = result.length > 0 ? result[result.length - 1].club?.id : null;
    // Trouver un boxeur d'un club différent du dernier placé
    const diffIdx = remaining.findIndex((b) => b.club?.id !== lastClubId);
    if (diffIdx >= 0) {
      result.push(remaining.splice(diffIdx, 1)[0]);
    } else {
      // Plus de diversité possible, prendre le premier restant
      result.push(remaining.shift()!);
    }
  }

  return result;
}

/** Retourne la valeur la plus fréquente d'un tableau de strings */
function mostFrequent(values: string[]): string {
  const counts = new Map<string, number>();
  for (const v of values) {
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let best = values[0];
  let bestCount = 0;
  counts.forEach((count, val) => {
    if (count > bestCount) { best = val; bestCount = count; }
  });
  return best;
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
