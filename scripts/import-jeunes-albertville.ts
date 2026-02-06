import { prisma } from "../src/lib/prisma";

// Données des jeunes d'Albertville
const jeunesData = [
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
];

async function main() {
  console.log("🚀 Ajout des jeunes au club d'Albertville\n");

  // 1. Trouver le club d'Albertville
  console.log("📋 Recherche du club BOXE FRANCAISE ALBERTVILLE...");
  const club = await prisma.club.findFirst({
    where: {
      nom: {
        contains: "ALBERTVILLE",
      },
    },
  });

  if (!club) {
    console.error("❌ Club BOXE FRANCAISE ALBERTVILLE non trouvé");
    return;
  }

  console.log(`✓ Club trouvé : ${club.nom} (ID: ${club.id})\n`);

  // 2. Créer les jeunes tireurs
  console.log("👥 Création des jeunes tireurs...");
  let created = 0;
  let errors = 0;

  for (const jeune of jeunesData) {
    try {
      // Parser la date DD/MM/YYYY
      const [jour, mois, annee] = jeune.dateNaissance.split("/");
      const dateNaissance = new Date(
        parseInt(annee),
        parseInt(mois) - 1,
        parseInt(jour)
      );

      // Extraire sexe et poids
      const sexe = jeune.poids[0]; // M ou F
      const poidsStr = jeune.poids.substring(1); // ex: "56"
      const poids = parseInt(poidsStr);

      // Créer le tireur
      const boxeur = await prisma.boxeur.create({
        data: {
          nom: jeune.nom,
          prenom: jeune.prenom,
          dateNaissance: dateNaissance,
          sexe: sexe,
          poids: poids,
          gant: jeune.gant,
          clubId: club.id,
        },
      });

      created++;
      const age = new Date().getFullYear() - parseInt(annee);
      console.log(
        `✓ ${created}. ${boxeur.prenom} ${boxeur.nom} - ${sexe}${poids}kg - ${age} ans - ${jeune.gant}`
      );
    } catch (error) {
      errors++;
      console.error(`✗ Erreur création ${jeune.prenom} ${jeune.nom}:`, error);
    }
  }

  console.log(`\n✅ Import terminé !`);
  console.log(`   - ${created} jeunes tireurs créés`);
  console.log(`   - ${errors} erreurs`);

  // 3. Résumé du club
  const clubWithCount = await prisma.club.findUnique({
    where: { id: club.id },
    include: {
      _count: {
        select: { boxeurs: true },
      },
    },
  });

  console.log(
    `\n📊 Total pour ${club.nom}: ${clubWithCount?._count.boxeurs} tireurs`
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
