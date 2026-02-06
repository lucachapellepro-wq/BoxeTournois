import { prisma } from "../src/lib/prisma";

// Fonction pour normaliser les chaînes (enlever les accents)
function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// Mapping des variations de noms
const nameAliases: Record<string, string[]> = {
  LEGOUESTRE: ["LE GOUESTRE", "LEGOUESTRE"],
  DECRESSAT: ["DECRESSAC", "DECRESSAT"],
};

// Données à mettre à jour
const updates = [
  {
    nom: "FRANCOIS",
    prenom: "Stephane",
    dateNaissance: "15/01/1984",
    poids: "M80",
    gant: "jaune",
  },
  {
    nom: "LEDAN",
    prenom: "Stephane",
    dateNaissance: "09/07/1991",
    poids: "M150",
    gant: "bleu",
  },
  {
    nom: "GILABER",
    prenom: "Cécile",
    dateNaissance: "01/01/1989", // 37 ans → 2026 - 37 = 1989
    poids: "F65",
    gant: "bleu",
  },
  {
    nom: "HOUPLAIN",
    prenom: "Axel",
    dateNaissance: "30/01/1985",
    poids: "M75",
    gant: "rouge",
  },
  {
    nom: "BERNARD",
    prenom: "Anthony",
    dateNaissance: "29/01/2009",
    poids: "M65",
    gant: "vert",
  },
  {
    nom: "REYBOZ",
    prenom: "Tom",
    dateNaissance: "10/12/2001",
    poids: "M70",
    gant: "rouge",
  },
  {
    nom: "DECRESSAC", // ou DECRESSAT
    prenom: "Pierre",
    dateNaissance: "01/08/1996",
    poids: "M80",
    gant: "bleu", // Débutant → bleu
  },
  {
    nom: "LEGOUESTRE", // ou LE GOUESTRE
    prenom: "Carine",
    dateNaissance: "13/10/1980",
    poids: "F52",
    gant: "jaune",
  },
];

async function main() {
  console.log("🔄 Mise à jour des boxeurs de Bourg Saint Maurice\n");

  // 1. Trouver le club de Bourg Saint Maurice
  const club = await prisma.club.findFirst({
    where: {
      nom: {
        contains: "BOURG",
      },
    },
    include: {
      boxeurs: true,
    },
  });

  if (!club) {
    console.error("❌ Club BF BOURG ST MAURICE non trouvé");
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
          normalize(b.prenom) === normalize(update.prenom);
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
      const poidsStr = update.poids.substring(1); // ex: "80"
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
