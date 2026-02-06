// Étape 2: Import des données dans PostgreSQL
// UTILISATION: S'assurer que DATABASE_URL pointe vers PostgreSQL dans .env
//              puis lancer: npx tsx scripts/import-postgres-data.ts

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

interface ExportData {
  clubs: any[];
  boxeurs: any[];
  tournois: any[];
  tournoiBoxeurs: any[];
  matches: any[];
  exportDate: string;
  sourceDb: string;
}

async function importData() {
  console.log('📥 Import des données dans PostgreSQL...\n');

  const exportPath = path.join(process.cwd(), 'migration-data.json');

  if (!fs.existsSync(exportPath)) {
    console.error('❌ Fichier migration-data.json non trouvé !');
    console.error('   Lancez d\'abord: npx tsx scripts/export-sqlite-data.ts');
    process.exit(1);
  }

  const data: ExportData = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));
  console.log(`📦 Données source: ${data.sourceDb} (${data.exportDate})\n`);

  const prisma = new PrismaClient();

  try {
    // Vérifier qu'on est bien sur PostgreSQL
    if (!process.env.DATABASE_URL?.startsWith('postgresql://')) {
      console.error('❌ DATABASE_URL doit pointer vers PostgreSQL');
      process.exit(1);
    }

    // 1. Clubs
    console.log(`📥 Import de ${data.clubs.length} clubs...`);
    for (const club of data.clubs) {
      await prisma.club.upsert({
        where: { id: club.id },
        update: {},
        create: {
          id: club.id,
          nom: club.nom,
          ville: club.ville,
          coach: club.coach,
          createdAt: new Date(club.createdAt),
        },
      });
    }
    console.log(`   ✓ ${data.clubs.length} clubs importés`);

    // 2. Boxeurs
    console.log(`📥 Import de ${data.boxeurs.length} boxeurs...`);
    for (const boxeur of data.boxeurs) {
      await prisma.boxeur.upsert({
        where: { id: boxeur.id },
        update: {},
        create: {
          id: boxeur.id,
          nom: boxeur.nom,
          prenom: boxeur.prenom,
          dateNaissance: new Date(boxeur.dateNaissance),
          sexe: boxeur.sexe,
          poids: boxeur.poids,
          gant: boxeur.gant,
          clubId: boxeur.clubId,
          categoriePoids: boxeur.categoriePoids,
          categorieAge: boxeur.categorieAge,
          infoIncomplete: boxeur.infoIncomplete,
          createdAt: new Date(boxeur.createdAt),
          updatedAt: new Date(boxeur.updatedAt),
        },
      });
    }
    console.log(`   ✓ ${data.boxeurs.length} boxeurs importés`);

    // 3. Tournois
    console.log(`📥 Import de ${data.tournois.length} tournois...`);
    for (const tournoi of data.tournois) {
      await prisma.tournoi.upsert({
        where: { id: tournoi.id },
        update: {},
        create: {
          id: tournoi.id,
          nom: tournoi.nom,
          date: new Date(tournoi.date),
          createdAt: new Date(tournoi.createdAt),
          updatedAt: new Date(tournoi.updatedAt),
        },
      });
    }
    console.log(`   ✓ ${data.tournois.length} tournois importés`);

    // 4. TournoiBoxeur
    console.log(`📥 Import de ${data.tournoiBoxeurs.length} inscriptions...`);
    let imported = 0;
    for (const tb of data.tournoiBoxeurs) {
      try {
        await prisma.tournoiBoxeur.create({
          data: {
            tournoiId: tb.tournoiId,
            boxeurId: tb.boxeurId,
          },
        });
        imported++;
      } catch (e) {
        // Ignorer les doublons
      }
    }
    console.log(`   ✓ ${imported} inscriptions importées`);

    // 5. Matchs
    console.log(`📥 Import de ${data.matches.length} matchs...`);
    for (const match of data.matches) {
      await prisma.match.upsert({
        where: { id: match.id },
        update: {},
        create: {
          id: match.id,
          tournoiId: match.tournoiId,
          boxeur1Id: match.boxeur1Id,
          boxeur2Id: match.boxeur2Id,
          matchType: match.matchType,
          sexe: match.sexe,
          categorieAge: match.categorieAge,
          categoriePoids: match.categoriePoids,
          gant: match.gant,
          categoryDisplay: match.categoryDisplay,
          bracketRound: match.bracketRound,
          bracketPosition: match.bracketPosition,
          nextMatchId: match.nextMatchId,
          poolName: match.poolName,
          status: match.status,
          winnerId: match.winnerId,
          displayOrder: match.displayOrder,
          createdAt: new Date(match.createdAt),
          updatedAt: new Date(match.updatedAt),
        },
      });
    }
    console.log(`   ✓ ${data.matches.length} matchs importés`);

    console.log('\n✅ Import terminé avec succès !');
    console.log('\n📊 Résumé:');
    console.log(`   - ${data.clubs.length} clubs`);
    console.log(`   - ${data.boxeurs.length} boxeurs`);
    console.log(`   - ${data.tournois.length} tournois`);
    console.log(`   - ${imported} inscriptions`);
    console.log(`   - ${data.matches.length} matchs`);
  } finally {
    await prisma.$disconnect();
  }
}

importData().catch(console.error);
