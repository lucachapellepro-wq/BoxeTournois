import { Boxeur } from "@/types";

export interface Match {
  id: string;
  category: string;
  boxeur1: Boxeur;
  boxeur2: Boxeur | null;
  status: "paired" | "waiting";
}

export function generateMatches(boxeurs: Boxeur[]): Match[] {
  const matches: Match[] = [];

  // Grouper par : catégorieAge + catégoriePoids + gant
  const groups = new Map<string, Boxeur[]>();

  boxeurs.forEach((b) => {
    const key = `${b.categorieAge}|${b.categoriePoids}|${b.gant}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(b);
  });

  // Créer les matchs dans chaque groupe
  groups.forEach((tireurs, key) => {
    const [catAge, catPoids] = key.split("|");
    const category = `${catAge} - ${catPoids}`;

    // Trier par club pour faciliter l'appariement
    tireurs.sort((a, b) => a.club.id - b.club.id);

    const paired = new Set<number>();

    // Algorithme glouton : apparier le premier disponible avec un adversaire de club différent
    for (let i = 0; i < tireurs.length; i++) {
      if (paired.has(tireurs[i].id)) continue;

      let opponent: Boxeur | null = null;

      // Chercher un adversaire de club différent
      for (let j = i + 1; j < tireurs.length; j++) {
        if (
          !paired.has(tireurs[j].id) &&
          tireurs[i].club.id !== tireurs[j].club.id
        ) {
          opponent = tireurs[j];
          paired.add(tireurs[j].id);
          break;
        }
      }

      if (opponent) {
        // Match trouvé
        matches.push({
          id: `${tireurs[i].id}-${opponent.id}`,
          category,
          boxeur1: tireurs[i],
          boxeur2: opponent,
          status: "paired",
        });
        paired.add(tireurs[i].id);
      } else {
        // Pas d'adversaire trouvé (nombre impair ou tous du même club)
        matches.push({
          id: `${tireurs[i].id}-waiting`,
          category,
          boxeur1: tireurs[i],
          boxeur2: null,
          status: "waiting",
        });
        paired.add(tireurs[i].id);
      }
    }
  });

  return matches;
}
