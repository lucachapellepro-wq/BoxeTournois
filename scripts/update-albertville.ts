import { prisma } from "../src/lib/prisma";

// Mapping des variations de noms
const nameAliases: Record<string, string[]> = {
  CHARMOT: ["CHAMIOT", "CHARMOT"],
  SAYOUD: ["SAYOU", "SAYOUD"],
};

// Données à mettre à jour (Jeunes + Adultes)
const updates = [
  // Catégorie JEUNE
  {
    nom: "CUSIN-MERMET",
    prenom: "Pauline",
    dateNaissance: "15/07/2009",
    poids: "F56",
    gant: "jaune",
  },
  {
    nom: "BRASSET",
    prenom: "Sacha",
    dateNaissance: "12/10/2010",
    poids: "M75",
    gant: "rouge",
  },
  {
    nom: "BUTTIGLERI",
    prenom: "Lino",
    dateNaissance: "14/10/2011",
    poids: "M42",
    gant: "rouge",
  },
  {
    nom: "CARTIER",
    prenom: "Ilan",
    dateNaissance: "03/09/2012",
    poids: "M42",
    gant: "bleu", // Par défaut car non spécifié
  },
  {
    nom: "BOUKHLAIK",
    prenom: "Ryan",
    dateNaissance: "13/02/2012",
    poids: "M39",
    gant: "bleu",
  },
  {
    nom: "BLYZNIUK",
    prenom: "Veronica",
    dateNaissance: "02/06/2012",
    poids: "F42",
    gant: "bleu",
  },
  // Catégorie ADULTE
  {
    nom: "HERDHUIN",
    prenom: "Stephanie",
    dateNaissance: "09/12/1983",
    poids: "F55",
    gant: "rouge",
  },
  {
    nom: "CHAMIOT", // ou CHARMOT
    prenom: "Morgane",
    dateNaissance: "25/04/1997",
    poids: "F70",
    gant: "rouge",
  },
  {
    nom: "SAYOU", // ou SAYOUD
    prenom: "Julien",
    dateNaissance: "28/03/1990",
    poids: "M65",
    gant: "blanc",
  },
  {
    nom: "FAVERO",
    prenom: "Marine",
    dateNaissance: "18/05/1993",
    poids: "F55",
    gant: "rouge",
  },
  {
    nom: "MESTRALLET",
    prenom: "Emeline",
    dateNaissance: "27/09/1988",
    poids: "F70",
    gant: "jaune",
  },
  {
    nom: "DIAS MIRANDELA", // Nom de famille peut varier
    prenom: "Sylvie",
    dateNaissance: "17/03/1995",
    poids: "F70",
    gant: "rouge",
  },
];

async function main() {
  console.log("🔄 Mise à jour des boxeurs d'Albertville\n");

  // 1. Trouver le club d'Albertville
  const club = await prisma.club.findFirst({
    where: {
      nom: {
        contains: "ALBERTVILLE",
      },
    },
    include: {
      boxeurs: true,
    },
  });

  if (!club) {
    console.error("❌ Club BOXE FRANCAISE ALBERTVILLE non trouvé");
    return;
  }

  console.log(`✓ Club trouvé : ${club.nom} (ID: ${club.id})`);
  console.log(`  ${club.boxeurs.length} boxeurs actuellement\n`);

  let updated = 0;
  let notFound = 0;

  for (const update of updates) {
    try {
      // Chercher le boxeur par nom et prénom (avec variations possibles)
      const boxeur = club.boxeurs.find((b) => {
        // Vérifier les alias de nom
        let nomMatch =
          b.nom.toUpperCase().includes(update.nom.toUpperCase()) ||
          update.nom.toUpperCase().includes(b.nom.toUpperCase());

        // Si pas de match direct, vérifier les alias
        if (!nomMatch) {
          for (const [canonical, aliases] of Object.entries(nameAliases)) {
            if (
              aliases.some(
                (alias) =>
                  b.nom.toUpperCase().includes(alias) ||
                  update.nom.toUpperCase().includes(alias)
              ) &&
              (b.nom.toUpperCase().includes(canonical) ||
                update.nom.toUpperCase().includes(canonical))
            ) {
              nomMatch = true;
              break;
            }
          }
        }

        const prenomMatch =
          b.prenom.toLowerCase() === update.prenom.toLowerCase();
        return nomMatch && prenomMatch;
      });

      if (!boxeur) {
        console.log(
          `⊘ ${update.prenom} ${update.nom} - Non trouvé (sera ignoré)`
        );
        notFound++;
        continue;
      }

      // Parser la date DD/MM/YYYY
      const [jour, mois, annee] = update.dateNaissance.split("/");
      const dateNaissance = new Date(
        parseInt(annee),
        parseInt(mois) - 1,
        parseInt(jour)
      );

      // Extraire sexe et poids
      const sexe = update.poids[0]; // M ou F
      const poidsStr = update.poids.substring(1); // ex: "56"
      const poids = parseInt(poidsStr);

      // Mettre à jour le boxeur
      await prisma.boxeur.update({
        where: { id: boxeur.id },
        data: {
          dateNaissance: dateNaissance,
          poids: poids,
          gant: update.gant,
          sexe: sexe,
        },
      });

      updated++;
      const age = new Date().getFullYear() - parseInt(annee);
      console.log(
        `✓ ${updated}. ${update.prenom} ${update.nom} - Mis à jour: ${sexe}${poids}kg, ${age} ans, gant ${update.gant}`
      );
    } catch (error) {
      console.error(`✗ Erreur pour ${update.prenom} ${update.nom}:`, error);
    }
  }

  console.log(`\n✅ Mise à jour terminée !`);
  console.log(`   - ${updated} boxeurs mis à jour`);
  console.log(`   - ${notFound} boxeurs non trouvés (ignorés)`);

  // Résumé final
  const clubUpdated = await prisma.club.findUnique({
    where: { id: club.id },
    include: {
      _count: {
        select: { boxeurs: true },
      },
    },
  });

  console.log(
    `\n📊 Total pour ${club.nom}: ${clubUpdated?._count.boxeurs} tireurs`
  );
}

main()
  .catch((e) => {
    console.error("❌ Erreur fatale:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
