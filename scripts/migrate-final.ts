// Migration finale: SQLite → PostgreSQL
// Utilise better-sqlite3 pour lire SQLite et PrismaClient pour écrire dans PostgreSQL

import Database from 'better-sqlite3';
import { PrismaClient } from '@prisma/client';
import path from 'path';

async function migrate() {
  console.log('🚀 Migration SQLite → PostgreSQL (Supabase)\n');
  console.log('='.repeat(50) + '\n');

  // 1. Ouvrir la base SQLite
  const sqlitePath = path.join(process.cwd(), 'prisma', 'dev.db');
  console.log(`📂 Lecture de: ${sqlitePath}\n`);
  const sqlite = new Database(sqlitePath, { readonly: true });

  // 2. Ouvrir la connexion PostgreSQL
  const prisma = new PrismaClient();

  try {
    // Vérifier la connexion PostgreSQL
    if (!process.env.DATABASE_URL?.startsWith('postgresql://')) {
      console.error('❌ DATABASE_URL doit pointer vers PostgreSQL');
      console.error('   Actuel:', process.env.DATABASE_URL);
      process.exit(1);
    }

    console.log('📦 Étape 1: Export depuis SQLite...\n');

    // Export des données
    const clubs = sqlite.prepare('SELECT * FROM Club').all();
    console.log(`   → ${clubs.length} clubs`);

    const boxeurs = sqlite.prepare('SELECT * FROM Boxeur').all();
    console.log(`   → ${boxeurs.length} boxeurs`);

    const tournois = sqlite.prepare('SELECT * FROM Tournoi').all();
    console.log(`   → ${tournois.length} tournois`);

    const tournoiBoxeurs = sqlite.prepare('SELECT * FROM TournoiBoxeur').all();
    console.log(`   → ${tournoiBoxeurs.length} inscriptions`);

    const matches = sqlite.prepare('SELECT * FROM Match').all();
    console.log(`   → ${matches.length} matchs`);

    console.log('\n📥 Étape 2: Import dans PostgreSQL...\n');

    // 1. Import des clubs
    console.log('📥 Import des clubs...');
    for (const club of clubs as any[]) {
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
    console.log(`   ✓ ${clubs.length} clubs importés`);

    // 2. Import des boxeurs
    console.log('📥 Import des boxeurs...');
    for (const boxeur of boxeurs as any[]) {
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
          infoIncomplete: boxeur.infoIncomplete === 1,
          createdAt: new Date(boxeur.createdAt),
          updatedAt: new Date(boxeur.updatedAt),
        },
      });
    }
    console.log(`   ✓ ${boxeurs.length} boxeurs importés`);

    // 3. Import des tournois
    console.log('📥 Import des tournois...');
    for (const tournoi of tournois as any[]) {
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
    console.log(`   ✓ ${tournois.length} tournois importés`);

    // 4. Import des inscriptions
    console.log('📥 Import des inscriptions...');
    let inscriptionCount = 0;
    for (const tb of tournoiBoxeurs as any[]) {
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
    for (const match of matches as any[]) {
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
    console.log(`   ✓ ${matches.length} matchs importés`);

    console.log('\n✅ Migration terminée avec succès !');
    console.log('\n📊 Résumé final:');
    console.log(`   - ${clubs.length} clubs`);
    console.log(`   - ${boxeurs.length} boxeurs`);
    console.log(`   - ${tournois.length} tournois`);
    console.log(`   - ${inscriptionCount} inscriptions`);
    console.log(`   - ${matches.length} matchs`);
    console.log('\n🎉 Vos données sont maintenant sur Supabase !');
  } catch (error) {
    console.error('\n❌ Erreur:', error);
    throw error;
  } finally {
    sqlite.close();
    await prisma.$disconnect();
  }
}

migrate();
