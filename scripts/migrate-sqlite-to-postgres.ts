// Script pour migrer les données de SQLite vers PostgreSQL (Supabase)
// Approche: Export JSON depuis SQLite, puis import dans PostgreSQL

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

interface ExportData {
  clubs: any[];
  boxeurs: any[];
  tournois: any[];
  tournoiBoxeurs: any[];
  matches: any[];
}

async function exportFromSQLite() {
  console.log('📦 Étape 1: Export depuis SQLite...\n');

  // Temporairement pointer vers SQLite
  const sqliteUrl = 'file:./prisma/dev.db';
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: sqliteUrl,
      },
    },
  });

  try {
    const clubs = await prisma.club.findMany();
    console.log(`   → ${clubs.length} clubs exportés`);

    const boxeurs = await prisma.boxeur.findMany();
    console.log(`   → ${boxeurs.length} boxeurs exportés`);

    const tournois = await prisma.tournoi.findMany();
    console.log(`   → ${tournois.length} tournois exportés`);

    const tournoiBoxeurs = await prisma.tournoiBoxeur.findMany();
    console.log(`   → ${tournoiBoxeurs.length} inscriptions exportées`);

    const matches = await prisma.match.findMany();
    console.log(`   → ${matches.length} matchs exportés`);

    const data: ExportData = {
      clubs,
      boxeurs,
      tournois,
      tournoiBoxeurs,
      matches,
    };

    // Sauvegarder dans un fichier temporaire
    const exportPath = path.join(process.cwd(), 'migration-data.json');
    fs.writeFileSync(exportPath, JSON.stringify(data, null, 2));
    console.log(`\n✅ Données exportées vers: ${exportPath}\n`);

    return data;
  } finally {
    await prisma.$disconnect();
  }
}

async function importToPostgreSQL(data: ExportData) {
  console.log('📥 Étape 2: Import dans PostgreSQL...\n');

  // Utiliser la DATABASE_URL de l'environnement (PostgreSQL)
  const prisma = new PrismaClient();

  try {
    // 1. Importer les clubs
    console.log('📥 Import des clubs...');
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

    // 2. Importer les boxeurs
    console.log('📥 Import des boxeurs...');
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

    // 3. Importer les tournois
    console.log('📥 Import des tournois...');
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

    // 4. Importer les relations TournoiBoxeur
    console.log('📥 Import des inscriptions...');
    for (const tb of data.tournoiBoxeurs) {
      try {
        await prisma.tournoiBoxeur.create({
          data: {
            tournoiId: tb.tournoiId,
            boxeurId: tb.boxeurId,
          },
        });
      } catch (e) {
        // Ignorer les doublons
      }
    }
    console.log(`   ✓ ${data.tournoiBoxeurs.length} inscriptions importées`);

    // 5. Importer les matchs
    console.log('📥 Import des matchs...');
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

    console.log('\n✅ Migration terminée avec succès !');
    console.log('\n📊 Résumé:');
    console.log(`   - ${data.clubs.length} clubs`);
    console.log(`   - ${data.boxeurs.length} boxeurs`);
    console.log(`   - ${data.tournois.length} tournois`);
    console.log(`   - ${data.tournoiBoxeurs.length} inscriptions`);
    console.log(`   - ${data.matches.length} matchs`);
  } finally {
    await prisma.$disconnect();
  }
}

async function migrate() {
  console.log('🚀 Migration SQLite → PostgreSQL\n');
  console.log('=' .repeat(50) + '\n');

  try {
    // Vérifier que la base SQLite existe
    const sqlitePath = path.join(process.cwd(), 'prisma', 'dev.db');
    if (!fs.existsSync(sqlitePath)) {
      console.error('❌ Fichier SQLite non trouvé:', sqlitePath);
      process.exit(1);
    }

    // Vérifier que DATABASE_URL pointe vers PostgreSQL
    if (!process.env.DATABASE_URL?.startsWith('postgresql://')) {
      console.error('❌ DATABASE_URL doit pointer vers PostgreSQL');
      console.error('   DATABASE_URL actuel:', process.env.DATABASE_URL);
      process.exit(1);
    }

    // Étape 1: Export depuis SQLite
    const data = await exportFromSQLite();

    // Étape 2: Import dans PostgreSQL
    await importToPostgreSQL(data);

    // Nettoyer le fichier temporaire
    const exportPath = path.join(process.cwd(), 'migration-data.json');
    if (fs.existsSync(exportPath)) {
      fs.unlinkSync(exportPath);
      console.log('\n🗑️  Fichier temporaire supprimé');
    }

    console.log('\n🎉 Migration complète ! Vos données sont maintenant sur Supabase.\n');
  } catch (error) {
    console.error('\n❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

migrate();
