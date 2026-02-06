import { prisma } from "../src/lib/prisma";

// Données brutes du tournoi
const clubsData = [
  { nom: "BF BOURG ST MAURICE", ville: "Bourg-Saint-Maurice" },
  { nom: "BOXE FRANCAISE ALBERTVILLE", ville: "Albertville" },
  { nom: "VVA FLUMET", ville: "Flumet" },
  { nom: "MOTTERAIN BF", ville: "Motterain" },
  { nom: "Impact Boxing 73", ville: "Savoie" },
  { nom: "SAVATE AIXOISE BOXE FRANCAISE", ville: "Aix-les-Bains" },
];

const tireursData = [
  { nom: "BERNARD", prenom: "Anthony", poids: "M65", club: "BF BOURG ST MAURICE", gant: "bleu" },
  { nom: "SAYOUD", prenom: "Julien", poids: "M65", club: "BOXE FRANCAISE ALBERTVILLE", gant: "rouge" },
  { nom: "GIBELLO", prenom: "Anthelme", poids: "M60", club: "BOXE FRANCAISE ALBERTVILLE", gant: "vert" },
  { nom: "RINGEVAL", prenom: "Remi", poids: "M53", club: "VVA FLUMET", gant: "vert" },
  { nom: "GRANGE", prenom: "Dorian", poids: "M70", club: "MOTTERAIN BF", gant: "bleu" },
  { nom: "HOUPLAIN", prenom: "Axel", poids: "M75", club: "BF BOURG ST MAURICE", gant: "rouge" },
  { nom: "CHAPELLE", prenom: "Luca", poids: "M75", club: "Union Savate Boxing", gant: "bleu" },
  { nom: "CASSERON DUC", prenom: "Kylian", poids: "M80", club: "BOXE FRANCAISE ALBERTVILLE", gant: "rouge" },
  { nom: "DEFORT", prenom: "Adrien", poids: "M80", club: "BOXE FRANCAISE ALBERTVILLE", gant: "jaune" },
  { nom: "FRANCOIS", prenom: "Stephane", poids: "M80", club: "BF BOURG ST MAURICE", gant: "jaune" },
  { nom: "SICCO", prenom: "Pierre", poids: "M80", club: "BOXE FRANCAISE ALBERTVILLE", gant: "jaune" },
  { nom: "PEZ", prenom: "Romuald", poids: "M85", club: "Impact Boxing 73", gant: "bleu" },
  { nom: "BAIS", prenom: "Robin", poids: "M85", club: "SAVATE AIXOISE BOXE FRANCAISE", gant: "bleu" },
  { nom: "CASTELLETAZ", prenom: "Romain", poids: "M85", club: "BOXE FRANCAISE ALBERTVILLE", gant: "vert" },
  { nom: "DECRESSAT", prenom: "Pierre", poids: "M85", club: "BF BOURG ST MAURICE", gant: "vert" },
  { nom: "PASSIEUX", prenom: "Simon", poids: "M150", club: "Union Savate Boxing", gant: "bleu" },
  { nom: "LEDAN", prenom: "Stephane", poids: "M150", club: "BF BOURG ST MAURICE", gant: "bleu" },
  { nom: "CHAIX", prenom: "Amelie", poids: "F52", club: "BOXE FRANCAISE ALBERTVILLE", gant: "jaune" },
  { nom: "CURIOTTI", prenom: "Emma", poids: "F52", club: "SAVATE AIXOISE BOXE FRANCAISE", gant: "bleu" },
  { nom: "LE GOUESTRE", prenom: "Carine", poids: "F52", club: "BF BOURG ST MAURICE", gant: "jaune" },
  { nom: "HERDHUIN", prenom: "Stephanie", poids: "F52", club: "BOXE FRANCAISE ALBERTVILLE", gant: "rouge" },
  { nom: "AUDEMAR", prenom: "Maite", poids: "F56", club: "MOTTERAIN BF", gant: "jaune" },
  { nom: "BOIVIN", prenom: "Marina", poids: "F60", club: "Union Savate Boxing", gant: "rouge" },
  { nom: "FAVERO", prenom: "Marine", poids: "F56", club: "BOXE FRANCAISE ALBERTVILLE", gant: "rouge" },
  { nom: "FRANCOIS", prenom: "Stephanie", poids: "F56", club: "BF BOURG ST MAURICE", gant: "rouge" },
  { nom: "BAILLY", prenom: "Vanessa", poids: "F65", club: "MOTTERAIN BF", gant: "bleu" },
  { nom: "JACQUIER", prenom: "Mathilde", poids: "F65", club: "Union Savate Boxing", gant: "bleu" },
  { nom: "CHARMOT", prenom: "Morgane", poids: "F70", club: "BOXE FRANCAISE ALBERTVILLE", gant: "blanc" },
  { nom: "TISSOT", prenom: "Mathilde", poids: "F65", club: "Union Savate Boxing", gant: "bleu" },
  { nom: "FONTAINE", prenom: "Léa", poids: "F65", club: "Union Savate Boxing", gant: "bleu" },
  { nom: "GILABER", prenom: "Cecile", poids: "F65", club: "BF BOURG ST MAURICE", gant: "bleu" },
  { nom: "PAYELLE", prenom: "Lèa", poids: "F65", club: "Union Savate Boxing", gant: "bleu" },
  { nom: "DIAS MIRANDELA", prenom: "Sylvie", poids: "F70", club: "BOXE FRANCAISE ALBERTVILLE", gant: "rouge" },
  { nom: "REYBOZ", prenom: "Tom", poids: "M70", club: "BF BOURG ST MAURICE", gant: "rouge" },
  { nom: "BALIGAND", prenom: "Louis", poids: "M70", club: "MOTTERAIN BF", gant: "jaune" },
  { nom: "BUTEL", prenom: "Théo", poids: "M70", club: "BF BOURG ST MAURICE", gant: "jaune" },
  { nom: "CLERGEOT", prenom: "Melodie", poids: "F56", club: "Union Savate Boxing", gant: "blanc" },
  { nom: "AUBIN", prenom: "Loris", poids: "M60", club: "Union Savate Boxing", gant: "blanc" },
  { nom: "CASSANDRI", prenom: "Clementine", poids: "F65", club: "Union Savate Boxing", gant: "blanc" },
];

async function main() {
  console.log("🚀 Début de l'importation des données du tournoi\n");

  // 1. Créer les clubs manquants
  console.log("📋 Étape 1 : Création des clubs...");
  const clubMap = new Map<string, number>();

  // D'abord, récupérer le club existant (Union Savate)
  const existingClub = await prisma.club.findFirst({
    where: {
      nom: {
        contains: "Union Savate",
      },
    },
  });
  if (existingClub) {
    clubMap.set("Union Savate Boxing", existingClub.id);
    console.log(`✓ Club existant : ${existingClub.nom} (ID: ${existingClub.id})`);
  }

  // Créer les nouveaux clubs
  for (const clubData of clubsData) {
    try {
      const club = await prisma.club.create({
        data: {
          nom: clubData.nom,
          ville: clubData.ville,
          coach: "",
        },
      });
      clubMap.set(clubData.nom, club.id);
      console.log(`✓ Club créé : ${club.nom} (ID: ${club.id})`);
    } catch (error) {
      console.error(`✗ Erreur création club ${clubData.nom}:`, error);
    }
  }

  console.log(`\n✅ ${clubMap.size} clubs au total\n`);

  // 2. Créer les tireurs
  console.log("👥 Étape 2 : Création des tireurs...");
  let created = 0;
  let errors = 0;

  for (const tireur of tireursData) {
    try {
      // Extraire sexe et poids
      const sexe = tireur.poids[0]; // M ou F
      const poidsStr = tireur.poids.substring(1); // ex: "65"
      const poids = poidsStr === "0" ? 70 : parseInt(poidsStr);

      // Trouver l'ID du club
      const clubId = clubMap.get(tireur.club);
      if (!clubId) {
        console.error(`✗ Club non trouvé : ${tireur.club} pour ${tireur.nom}`);
        errors++;
        continue;
      }

      // Créer le tireur
      const boxeur = await prisma.boxeur.create({
        data: {
          nom: tireur.nom,
          prenom: tireur.prenom,
          dateNaissance: new Date(1990, 0, 1), // 1er janvier 1990
          sexe: sexe,
          poids: poids,
          gant: tireur.gant,
          clubId: clubId,
        },
      });

      created++;
      console.log(
        `✓ ${created}. ${boxeur.prenom} ${boxeur.nom} - ${sexe}${poids}kg - ${tireur.club} - ${tireur.gant}`
      );
    } catch (error) {
      errors++;
      console.error(`✗ Erreur création ${tireur.prenom} ${tireur.nom}:`, error);
    }
  }

  console.log(`\n✅ Import terminé !`);
  console.log(`   - ${created} tireurs créés`);
  console.log(`   - ${errors} erreurs`);
  console.log(`\n📊 Résumé final :`);

  const clubs = await prisma.club.findMany({
    include: {
      _count: {
        select: { boxeurs: true },
      },
    },
  });

  clubs.forEach((club) => {
    console.log(`   🥊 ${club.nom}: ${club._count.boxeurs} tireurs`);
  });

  const total = await prisma.boxeur.count();
  console.log(`\n   Total : ${total} tireurs dans la base`);
}

main()
  .catch((e) => {
    console.error("❌ Erreur fatale:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
