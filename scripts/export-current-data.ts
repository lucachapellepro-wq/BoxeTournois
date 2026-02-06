// Export de toutes les données de la base actuelle (Supabase)
// Ces données seront importées dans Vercel Postgres

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

async function exportData() {
  console.log('📦 Export des données depuis Supabase...\n');

  const prisma = new PrismaClient();

  try {
    // 1. Export des clubs
    const clubs = await prisma.club.findMany();
    console.log(`   ✓ ${clubs.length} clubs exportés`);

    // 2. Export des boxeurs
    const boxeurs = await prisma.boxeur.findMany();
    console.log(`   ✓ ${boxeurs.length} boxeurs exportés`);

    // 3. Export des tournois
    const tournois = await prisma.tournoi.findMany();
    console.log(`   ✓ ${tournois.length} tournois exportés`);

    // 4. Export des inscriptions
    const tournoiBoxeurs = await prisma.tournoiBoxeur.findMany();
    console.log(`   ✓ ${tournoiBoxeurs.length} inscriptions exportées`);

    // 5. Export des matchs
    const matches = await prisma.match.findMany();
    console.log(`   ✓ ${matches.length} matchs exportés`);

    // Créer l'objet de données
    const exportData = {
      exportDate: new Date().toISOString(),
      source: 'Supabase',
      destination: 'Vercel Postgres',
      stats: {
        clubs: clubs.length,
        boxeurs: boxeurs.length,
        tournois: tournois.length,
        inscriptions: tournoiBoxeurs.length,
        matches: matches.length,
      },
      data: {
        clubs,
        boxeurs,
        tournois,
        tournoiBoxeurs,
        matches,
      },
    };

    // Sauvegarder dans un fichier
    const exportPath = path.join(process.cwd(), 'vercel-postgres-import.json');
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));

    const fileSize = (fs.statSync(exportPath).size / 1024).toFixed(2);

    console.log('\n✅ Export terminé !');
    console.log(`\n📁 Fichier: vercel-postgres-import.json`);
    console.log(`📊 Taille: ${fileSize} KB`);
    console.log('\n📋 Résumé:');
    console.log(`   - ${clubs.length} clubs`);
    console.log(`   - ${boxeurs.length} boxeurs`);
    console.log(`   - ${tournois.length} tournois`);
    console.log(`   - ${tournoiBoxeurs.length} inscriptions`);
    console.log(`   - ${matches.length} matchs`);
    console.log('\n💡 Ce fichier sera utilisé pour importer dans Vercel Postgres');
  } catch (error) {
    console.error('\n❌ Erreur lors de l\'export:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

exportData();
