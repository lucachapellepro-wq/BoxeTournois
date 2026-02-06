// Import des données dans Vercel Postgres
// À lancer APRÈS avoir créé la base Vercel Postgres et configuré DATABASE_URL

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

interface ImportData {
  exportDate: string;
  source: string;
  destination: string;
  stats: {
    clubs: number;
    boxeurs: number;
    tournois: number;
    inscriptions: number;
    matches: number;
  };
  data: {
    clubs: any[];
    boxeurs: any[];
    tournois: any[];
    tournoiBoxeurs: any[];
    matches: any[];
  };
}

async function importData() {
  console.log('📥 Import des données dans Vercel Postgres\n');
  console.log('='.repeat(50) + '\n');

  // Vérifier que le fichier existe
  const importPath = path.join(process.cwd(), 'vercel-postgres-import.json');
  if (!fs.existsSync(importPath)) {
    console.error('❌ Fichier vercel-postgres-import.json non trouvé !');
    console.error('   Lance d\'abord: npx tsx scripts/export-current-data.ts');
    process.exit(1);
  }

  // Charger les données
  const importData: ImportData = JSON.parse(fs.readFileSync(importPath, 'utf-8'));
  console.log(`📦 Source: ${importData.source}`);
  console.log(`📅 Date d'export: ${new Date(importData.exportDate).toLocaleString('fr-FR')}`);
  console.log(`\n📊 Données à importer:`);
  console.log(`   - ${importData.stats.clubs} clubs`);
  console.log(`   - ${importData.stats.boxeurs} boxeurs`);
  console.log(`   - ${importData.stats.tournois} tournois`);
  console.log(`   - ${importData.stats.inscriptions} inscriptions`);
  console.log(`   - ${importData.stats.matches} matchs`);
  console.log('\n' + '='.repeat(50) + '\n');

  const prisma = new PrismaClient();

  try {
    // Vérifier la connexion
    await prisma.$connect();
    console.log('✅ Connexion à Vercel Postgres établie\n');

    // 1. Import des clubs
    console.log('📥 Import des clubs...');
    for (const club of importData.data.clubs) {
      await prisma.club.upsert({
        where: { id: club.id },
        update: {},
        create: {
          id: club.id,
          nom: club.nom,
          ville: club.ville,
          coach: club.coach || null,
          createdAt: new Date(club.createdAt),
        },
      });
    }
    console.log(`   ✓ ${importData.data.clubs.length} clubs importés`);

    // 2. Import des boxeurs
    console.log('📥 Import des boxeurs...');
    for (const boxeur of importData.data.boxeurs) {
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
          categoriePoids: boxeur.categoriePoids || null,
          categorieAge: boxeur.categorieAge || null,
          infoIncomplete: boxeur.infoIncomplete,
          createdAt: new Date(boxeur.createdAt),
          updatedAt: new Date(boxeur.updatedAt),
        },
      });
    }
    console.log(`   ✓ ${importData.data.boxeurs.length} boxeurs importés`);

    // 3. Import des tournois
    console.log('📥 Import des tournois...');
    for (const tournoi of importData.data.tournois) {
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
    console.log(`   ✓ ${importData.data.tournois.length} tournois importés`);

    // 4. Import des inscriptions
    console.log('📥 Import des inscriptions...');
    let inscriptionCount = 0;
    for (const tb of importData.data.tournoiBoxeurs) {
      try {
        await prisma.tournoiBoxeur.create({
          data: {
            tournoiId: tb.tournoiId,
            boxeurId: tb.boxeurId,
          },
        });
        inscriptionCount++;
      } catch (e) {
        // Ignorer les doublons
      }
    }
    console.log(`   ✓ ${inscriptionCount} inscriptions importées`);

    // 5. Import des matchs
    console.log('📥 Import des matchs...');
    for (const match of importData.data.matches) {
      await prisma.match.upsert({
        where: { id: match.id },
        update: {},
        create: {
          id: match.id,
          tournoiId: match.tournoiId,
          boxeur1Id: match.boxeur1Id || null,
          boxeur2Id: match.boxeur2Id || null,
          matchType: match.matchType,
          sexe: match.sexe,
          categorieAge: match.categorieAge,
          categoriePoids: match.categoriePoids,
          gant: match.gant,
          categoryDisplay: match.categoryDisplay,
          bracketRound: match.bracketRound || null,
          bracketPosition: match.bracketPosition || null,
          nextMatchId: match.nextMatchId || null,
          poolName: match.poolName || null,
          status: match.status,
          winnerId: match.winnerId || null,
          displayOrder: match.displayOrder,
          createdAt: new Date(match.createdAt),
          updatedAt: new Date(match.updatedAt),
        },
      });
    }
    console.log(`   ✓ ${importData.data.matches.length} matchs importés`);

    console.log('\n' + '='.repeat(50));
    console.log('\n✅ Import terminé avec succès !');
    console.log('\n📊 Résumé final:');
    console.log(`   - ${importData.data.clubs.length} clubs`);
    console.log(`   - ${importData.data.boxeurs.length} boxeurs`);
    console.log(`   - ${importData.data.tournois.length} tournois`);
    console.log(`   - ${inscriptionCount} inscriptions`);
    console.log(`   - ${importData.data.matches.length} matchs`);
    console.log('\n🎉 Toutes tes données sont maintenant sur Vercel Postgres !');
    console.log('\n💡 Tu peux maintenant déployer sur Vercel');
  } catch (error) {
    console.error('\n❌ Erreur lors de l\'import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importData();
