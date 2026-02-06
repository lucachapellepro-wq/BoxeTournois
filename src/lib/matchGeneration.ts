import { Boxeur } from "@/types";
import { MatchCreateData, CategoryInfo, BracketRound } from "@/types/match";

/**
 * Point d'entrée principal : génère tous les matchs pour un tournoi
 * NOUVELLE LOGIQUE : Grouper UNIQUEMENT par catégorie de poids
 */
export function generateMatches(
  boxeurs: Boxeur[],
  tournoiId: number
): MatchCreateData[] {
  const matches: MatchCreateData[] = [];

  // Grouper par SEXE + CATÉGORIE DE POIDS (pas de mixité H/F)
  const groups = new Map<string, Boxeur[]>();

  boxeurs.forEach((b) => {
    const key = `${b.sexe}|${b.categoriePoids}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(b);
  });

  // Pour chaque groupe, générer selon le nombre
  groups.forEach((groupBoxeurs, key) => {
    const [sexe, catPoids] = key.split("|");
    const count = groupBoxeurs.length;

    // Catégorie d'affichage
    const category: CategoryInfo = {
      sexe: sexe,
      categorieAge: groupBoxeurs[0].categorieAge,
      categoriePoids: catPoids,
      gant: groupBoxeurs[0].gant,
      categoryDisplay: catPoids,
    };

    // Si 1 seul boxeur, créer un match seul (finale)
    if (count === 1) {
      matches.push({
        tournoiId,
        boxeur1Id: groupBoxeurs[0].id,
        boxeur2Id: null,
        matchType: "BRACKET",
        sexe: category.sexe,
        categorieAge: category.categorieAge,
        categoriePoids: category.categoriePoids,
        gant: category.gant,
        categoryDisplay: category.categoryDisplay,
        bracketRound: BracketRound.FINAL,
        bracketPosition: 0,
        displayOrder: 0,
      });
      return;
    }

    // Générer selon le nombre
    let generatedMatches: MatchCreateData[] = [];

    switch (count) {
      case 2:
        generatedMatches = generate2Boxeurs(groupBoxeurs, category, tournoiId);
        break;
      case 3:
        generatedMatches = generate3Boxeurs(groupBoxeurs, category, tournoiId);
        break;
      case 4:
        generatedMatches = generate4Boxeurs(groupBoxeurs, category, tournoiId);
        break;
      case 5:
        generatedMatches = generate5Boxeurs(groupBoxeurs, category, tournoiId);
        break;
      case 6:
        generatedMatches = generate6Boxeurs(groupBoxeurs, category, tournoiId);
        break;
      case 7:
        generatedMatches = generate7Boxeurs(groupBoxeurs, category, tournoiId);
        break;
      case 8:
        generatedMatches = generate8Boxeurs(groupBoxeurs, category, tournoiId);
        break;
      default:
        // Pour plus de 8, faire des poules
        generatedMatches = generatePools(groupBoxeurs, category, tournoiId);
        break;
    }

    matches.push(...generatedMatches);
  });

  return matches;
}

/**
 * 2 boxeurs : 1 finale
 */
function generate2Boxeurs(
  boxers: Boxeur[],
  category: CategoryInfo,
  tournoiId: number
): MatchCreateData[] {
  return [
    {
      tournoiId,
      boxeur1Id: boxers[0].id,
      boxeur2Id: boxers[1].id,
      matchType: "BRACKET",
      sexe: category.sexe,
      categorieAge: category.categorieAge,
      categoriePoids: category.categoriePoids,
      gant: category.gant,
      categoryDisplay: category.categoryDisplay,
      bracketRound: BracketRound.FINAL,
      bracketPosition: 0,
      displayOrder: 0,
    },
  ];
}

/**
 * 3 boxeurs : tous s'affrontent (poule de 3)
 */
function generate3Boxeurs(
  boxers: Boxeur[],
  category: CategoryInfo,
  tournoiId: number
): MatchCreateData[] {
  const matches: MatchCreateData[] = [];
  let order = 0;

  for (let i = 0; i < 3; i++) {
    for (let j = i + 1; j < 3; j++) {
      matches.push({
        tournoiId,
        boxeur1Id: boxers[i].id,
        boxeur2Id: boxers[j].id,
        matchType: "POOL",
        sexe: category.sexe,
        categorieAge: category.categorieAge,
        categoriePoids: category.categoriePoids,
        gant: category.gant,
        categoryDisplay: category.categoryDisplay,
        poolName: "A",
        displayOrder: order++,
      });
    }
  }

  return matches;
}

/**
 * 4 boxeurs : 2 demi-finales + 1 finale de prévu
 * Critères de séparation : âge > gant > club différent
 */
function generate4Boxeurs(
  boxers: Boxeur[],
  category: CategoryInfo,
  tournoiId: number
): MatchCreateData[] {
  // Séparer en 2 groupes en essayant de maximiser la diversité
  const sorted = smartPairing(boxers);

  return [
    // Demi 1
    {
      tournoiId,
      boxeur1Id: sorted[0].id,
      boxeur2Id: sorted[1].id,
      matchType: "BRACKET",
      sexe: category.sexe,
      categorieAge: category.categorieAge,
      categoriePoids: category.categoriePoids,
      gant: category.gant,
      categoryDisplay: category.categoryDisplay,
      bracketRound: BracketRound.DEMI,
      bracketPosition: 0,
      displayOrder: 0,
    },
    // Demi 2
    {
      tournoiId,
      boxeur1Id: sorted[2].id,
      boxeur2Id: sorted[3].id,
      matchType: "BRACKET",
      sexe: category.sexe,
      categorieAge: category.categorieAge,
      categoriePoids: category.categoriePoids,
      gant: category.gant,
      categoryDisplay: category.categoryDisplay,
      bracketRound: BracketRound.DEMI,
      bracketPosition: 1,
      displayOrder: 1,
    },
    // Finale de prévu (TBD)
    {
      tournoiId,
      boxeur1Id: null,
      boxeur2Id: null,
      matchType: "BRACKET",
      sexe: category.sexe,
      categorieAge: category.categorieAge,
      categoriePoids: category.categoriePoids,
      gant: category.gant,
      categoryDisplay: category.categoryDisplay,
      bracketRound: BracketRound.FINAL,
      bracketPosition: 0,
      displayOrder: 2,
    },
  ];
}

/**
 * 5 boxeurs : 1 poule de 3 + 1 poule de 2 + 1 finale de prévu
 */
function generate5Boxeurs(
  boxers: Boxeur[],
  category: CategoryInfo,
  tournoiId: number
): MatchCreateData[] {
  const matches: MatchCreateData[] = [];
  let order = 0;

  // Poule A : 3 boxeurs (round-robin)
  const pouleA = boxers.slice(0, 3);
  for (let i = 0; i < 3; i++) {
    for (let j = i + 1; j < 3; j++) {
      matches.push({
        tournoiId,
        boxeur1Id: pouleA[i].id,
        boxeur2Id: pouleA[j].id,
        matchType: "POOL",
        sexe: category.sexe,
        categorieAge: category.categorieAge,
        categoriePoids: category.categoriePoids,
        gant: category.gant,
        categoryDisplay: category.categoryDisplay,
        poolName: "A",
        displayOrder: order++,
      });
    }
  }

  // Poule B : 2 boxeurs
  matches.push({
    tournoiId,
    boxeur1Id: boxers[3].id,
    boxeur2Id: boxers[4].id,
    matchType: "POOL",
    sexe: category.sexe,
    categorieAge: category.categorieAge,
    categoriePoids: category.categoriePoids,
    gant: category.gant,
    categoryDisplay: category.categoryDisplay,
    poolName: "B",
    displayOrder: order++,
  });

  // Finale de prévu (TBD) - reste en POOL
  matches.push({
    tournoiId,
    boxeur1Id: null,
    boxeur2Id: null,
    matchType: "POOL",
    sexe: category.sexe,
    categorieAge: category.categorieAge,
    categoriePoids: category.categoriePoids,
    gant: category.gant,
    categoryDisplay: category.categoryDisplay,
    poolName: "FINALE",
    displayOrder: order++,
  });

  return matches;
}

/**
 * 6 boxeurs : 2 poules de 3 + 1 finale de prévu
 */
function generate6Boxeurs(
  boxers: Boxeur[],
  category: CategoryInfo,
  tournoiId: number
): MatchCreateData[] {
  const matches: MatchCreateData[] = [];
  let order = 0;

  // Poule A : boxeurs 0, 1, 2
  const pouleA = boxers.slice(0, 3);
  for (let i = 0; i < 3; i++) {
    for (let j = i + 1; j < 3; j++) {
      matches.push({
        tournoiId,
        boxeur1Id: pouleA[i].id,
        boxeur2Id: pouleA[j].id,
        matchType: "POOL",
        sexe: category.sexe,
        categorieAge: category.categorieAge,
        categoriePoids: category.categoriePoids,
        gant: category.gant,
        categoryDisplay: category.categoryDisplay,
        poolName: "A",
        displayOrder: order++,
      });
    }
  }

  // Poule B : boxeurs 3, 4, 5
  const pouleB = boxers.slice(3, 6);
  for (let i = 0; i < 3; i++) {
    for (let j = i + 1; j < 3; j++) {
      matches.push({
        tournoiId,
        boxeur1Id: pouleB[i].id,
        boxeur2Id: pouleB[j].id,
        matchType: "POOL",
        sexe: category.sexe,
        categorieAge: category.categorieAge,
        categoriePoids: category.categoriePoids,
        gant: category.gant,
        categoryDisplay: category.categoryDisplay,
        poolName: "B",
        displayOrder: order++,
      });
    }
  }

  // Finale de prévu (TBD) - reste en POOL
  matches.push({
    tournoiId,
    boxeur1Id: null,
    boxeur2Id: null,
    matchType: "POOL",
    sexe: category.sexe,
    categorieAge: category.categorieAge,
    categoriePoids: category.categoriePoids,
    gant: category.gant,
    categoryDisplay: category.categoryDisplay,
    poolName: "FINALE",
    displayOrder: order++,
  });

  return matches;
}

/**
 * 7 boxeurs : 1 poule de 4 + 1 poule de 3
 */
function generate7Boxeurs(
  boxers: Boxeur[],
  category: CategoryInfo,
  tournoiId: number
): MatchCreateData[] {
  const matches: MatchCreateData[] = [];
  let order = 0;

  // Poule A : 4 boxeurs (round-robin)
  const pouleA = boxers.slice(0, 4);
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      matches.push({
        tournoiId,
        boxeur1Id: pouleA[i].id,
        boxeur2Id: pouleA[j].id,
        matchType: "POOL",
        sexe: category.sexe,
        categorieAge: category.categorieAge,
        categoriePoids: category.categoriePoids,
        gant: category.gant,
        categoryDisplay: category.categoryDisplay,
        poolName: "A",
        displayOrder: order++,
      });
    }
  }

  // Poule B : 3 boxeurs (round-robin)
  const pouleB = boxers.slice(4, 7);
  for (let i = 0; i < 3; i++) {
    for (let j = i + 1; j < 3; j++) {
      matches.push({
        tournoiId,
        boxeur1Id: pouleB[i].id,
        boxeur2Id: pouleB[j].id,
        matchType: "POOL",
        sexe: category.sexe,
        categorieAge: category.categorieAge,
        categoriePoids: category.categoriePoids,
        gant: category.gant,
        categoryDisplay: category.categoryDisplay,
        poolName: "B",
        displayOrder: order++,
      });
    }
  }

  return matches;
}

/**
 * 8 boxeurs : Quarts + Demis de prévu + Finale de prévu
 */
function generate8Boxeurs(
  boxers: Boxeur[],
  category: CategoryInfo,
  tournoiId: number
): MatchCreateData[] {
  const sorted = smartPairing(boxers);
  const matches: MatchCreateData[] = [];

  // 4 Quarts
  for (let i = 0; i < 4; i++) {
    matches.push({
      tournoiId,
      boxeur1Id: sorted[i * 2].id,
      boxeur2Id: sorted[i * 2 + 1].id,
      matchType: "BRACKET",
      sexe: category.sexe,
      categorieAge: category.categorieAge,
      categoriePoids: category.categoriePoids,
      gant: category.gant,
      categoryDisplay: category.categoryDisplay,
      bracketRound: BracketRound.QUART,
      bracketPosition: i,
      displayOrder: i,
    });
  }

  // 2 Demis de prévu (TBD)
  for (let i = 0; i < 2; i++) {
    matches.push({
      tournoiId,
      boxeur1Id: null,
      boxeur2Id: null,
      matchType: "BRACKET",
      sexe: category.sexe,
      categorieAge: category.categorieAge,
      categoriePoids: category.categoriePoids,
      gant: category.gant,
      categoryDisplay: category.categoryDisplay,
      bracketRound: BracketRound.DEMI,
      bracketPosition: i,
      displayOrder: 4 + i,
    });
  }

  // 1 Finale de prévu (TBD)
  matches.push({
    tournoiId,
    boxeur1Id: null,
    boxeur2Id: null,
    matchType: "BRACKET",
    sexe: category.sexe,
    categorieAge: category.categorieAge,
    categoriePoids: category.categoriePoids,
    gant: category.gant,
    categoryDisplay: category.categoryDisplay,
    bracketRound: BracketRound.FINAL,
    bracketPosition: 0,
    displayOrder: 6,
  });

  return matches;
}

/**
 * Génère des poules round-robin (pour > 8 boxeurs)
 */
export function generatePools(
  boxers: Boxeur[],
  category: CategoryInfo,
  tournoiId: number
): MatchCreateData[] {
  const matches: MatchCreateData[] = [];
  const pools = divideIntoPools(boxers);

  pools.forEach((pool, poolIdx) => {
    const poolName = String.fromCharCode(65 + poolIdx); // A, B, C...

    // Générer round-robin : tous vs tous
    for (let i = 0; i < pool.length; i++) {
      for (let j = i + 1; j < pool.length; j++) {
        matches.push({
          tournoiId,
          boxeur1Id: pool[i].id,
          boxeur2Id: pool[j].id,
          matchType: "POOL",
          sexe: category.sexe,
          categorieAge: category.categorieAge,
          categoriePoids: category.categoriePoids,
          gant: category.gant,
          categoryDisplay: category.categoryDisplay,
          poolName,
          displayOrder: matches.length,
        });
      }
    }
  });

  return matches;
}

/**
 * Appariement intelligent : essayer de varier âge, gant, club
 */
function smartPairing(boxers: Boxeur[]): Boxeur[] {
  // Trier par : âge, puis gant, puis club
  return [...boxers].sort((a, b) => {
    if (a.categorieAge !== b.categorieAge) {
      return a.categorieAge.localeCompare(b.categorieAge);
    }
    if (a.gant !== b.gant) {
      return a.gant.localeCompare(b.gant);
    }
    return a.club.id - b.club.id;
  });
}

/**
 * Divise les boxeurs en poules de 3-4
 */
function divideIntoPools(boxers: Boxeur[]): Boxeur[][] {
  const n = boxers.length;
  const numPools = Math.ceil(n / 4);
  const pools: Boxeur[][] = Array.from({ length: numPools }, () => []);

  // Distribution snake draft pour équilibrer
  boxers.forEach((boxer, idx) => {
    const poolIdx = idx % numPools;
    pools[poolIdx].push(boxer);
  });

  return pools;
}

/**
 * Retourne le nom du round en fonction du nombre total de rounds et de la position
 * @param totalRounds Nombre total de rounds (1 pour 2 boxeurs, 2 pour 4, 3 pour 8, 4 pour 16)
 * @param roundIndex Position du round (0 = premier round)
 */
export function getRoundName(totalRounds: number, roundIndex: number): string {
  // Pour 2 boxeurs (1 round) : FINAL
  // Pour 4 boxeurs (2 rounds) : DEMI, FINAL
  // Pour 8 boxeurs (3 rounds) : QUART, DEMI, FINAL
  // Pour 16 boxeurs (4 rounds) : HUITIEME, QUART, DEMI, FINAL

  const allRounds = [
    BracketRound.HUITIEME,
    BracketRound.QUART,
    BracketRound.DEMI,
    BracketRound.FINAL,
  ];

  // Calculer l'offset : on commence depuis la fin
  const offset = 4 - totalRounds;
  return allRounds[offset + roundIndex];
}

/**
 * Lie les matchs d'un bracket avec nextMatchId
 * À appeler après création des matchs en base
 */
export function linkBracketMatches(matches: Array<{ id: number; bracketRound: string | null; bracketPosition: number | null }>): Array<{ id: number; nextMatchId: number | null }> {
  const updates: Array<{ id: number; nextMatchId: number | null }> = [];

  // Grouper par round
  const rounds = new Map<string, Array<{ id: number; bracketPosition: number }>>();

  matches.forEach((m) => {
    if (m.bracketRound) {
      if (!rounds.has(m.bracketRound)) {
        rounds.set(m.bracketRound, []);
      }
      rounds.get(m.bracketRound)!.push({
        id: m.id,
        bracketPosition: m.bracketPosition!,
      });
    }
  });

  // Ordre des rounds : HUITIEME → QUART → DEMI → FINAL
  const roundOrder = [
    BracketRound.HUITIEME,
    BracketRound.QUART,
    BracketRound.DEMI,
    BracketRound.FINAL,
  ];

  // Pour chaque round, lier au round suivant
  for (let i = 0; i < roundOrder.length - 1; i++) {
    const currentRound = roundOrder[i];
    const nextRound = roundOrder[i + 1];

    const currentMatches = rounds.get(currentRound);
    const nextMatches = rounds.get(nextRound);

    if (!currentMatches || !nextMatches) continue;

    // Trier par position
    currentMatches.sort((a, b) => a.bracketPosition - b.bracketPosition);
    nextMatches.sort((a, b) => a.bracketPosition - b.bracketPosition);

    // Lier 2 matchs du round actuel → 1 match du round suivant
    currentMatches.forEach((match, idx) => {
      const nextMatchIdx = Math.floor(idx / 2);
      const nextMatchId = nextMatches[nextMatchIdx]?.id || null;

      updates.push({
        id: match.id,
        nextMatchId,
      });
    });
  }

  return updates;
}
