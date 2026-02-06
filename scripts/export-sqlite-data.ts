// Étape 1: Export des données depuis SQLite
// UTILISATION: Temporairement changer DATABASE_URL vers "file:./dev.db" dans .env
//              puis lancer: npx tsx scripts/export-sqlite-data.ts

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

async function exportData() {
  console.log('📦 Export des données depuis la base actuelle...\n');

  const prisma = new PrismaClient();

  try {
    const clubs = await prisma.club.findMany();
    console.log(`   → ${clubs.length} clubs`);

    const boxeurs = await prisma.boxeur.findMany();
    console.log(`   → ${boxeurs.length} boxeurs`);

    const tournois = await prisma.tournoi.findMany();
    console.log(`   → ${tournois.length} tournois`);

    const tournoiBoxeurs = await prisma.tournoiBoxeur.findMany();
    console.log(`   → ${tournoiBoxeurs.length} inscriptions`);

    const matches = await prisma.match.findMany();
    console.log(`   → ${matches.length} matchs`);

    const data = {
      clubs,
      boxeurs,
      tournois,
      tournoiBoxeurs,
      matches,
      exportDate: new Date().toISOString(),
      sourceDb: process.env.DATABASE_URL?.includes('file:') ? 'SQLite' : 'PostgreSQL',
    };

    const exportPath = path.join(process.cwd(), 'migration-data.json');
    fs.writeFileSync(exportPath, JSON.stringify(data, null, 2));

    console.log(`\n✅ Données exportées vers: migration-data.json`);
    console.log(`📊 Taille: ${(fs.statSync(exportPath).size / 1024).toFixed(2)} KB`);
  } finally {
    await prisma.$disconnect();
  }
}

exportData().catch(console.error);
