import { prisma } from "../src/lib/prisma";
import fs from "fs";
import path from "path";

async function exportDatabase() {
  console.log("📤 Export de la base de données...\n");

  // Récupérer toutes les données
  const clubs = await prisma.club.findMany({
    include: {
      boxeurs: true,
    },
  });

  const boxeurs = await prisma.boxeur.findMany({
    include: {
      club: true,
    },
  });

  const data = {
    exportDate: new Date().toISOString(),
    stats: {
      clubs: clubs.length,
      boxeurs: boxeurs.length,
    },
    clubs: clubs.map((c) => ({
      id: c.id,
      nom: c.nom,
      ville: c.ville,
      coach: c.coach,
      boxeursCount: c.boxeurs.length,
    })),
    boxeurs: boxeurs.map((b) => ({
      id: b.id,
      nom: b.nom,
      prenom: b.prenom,
      dateNaissance: b.dateNaissance,
      sexe: b.sexe,
      poids: b.poids,
      gant: b.gant,
      categoriePoids: b.categoriePoids,
      categorieAge: b.categorieAge,
      club: {
        id: b.club.id,
        nom: b.club.nom,
      },
    })),
  };

  // Créer le dossier exports s'il n'existe pas
  const exportDir = path.join(process.cwd(), "prisma", "exports");
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  // Sauvegarder en JSON
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const exportPath = path.join(exportDir, `export-${timestamp}.json`);
  fs.writeFileSync(exportPath, JSON.stringify(data, null, 2));

  console.log(`✅ Export créé: ${exportPath}`);
  console.log(`\n📊 Statistiques:`);
  console.log(`   - ${data.stats.clubs} clubs`);
  console.log(`   - ${data.stats.boxeurs} boxeurs`);
  console.log(`\n💾 Taille: ${(fs.statSync(exportPath).size / 1024).toFixed(2)} KB`);
}

exportDatabase()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
