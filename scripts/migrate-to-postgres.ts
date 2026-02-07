import { PrismaClient } from '@prisma/client';
import Database from 'better-sqlite3';

async function migrate() {
  console.log('🚀 Début de la migration SQLite → PostgreSQL\n');

  // Connexion PostgreSQL
  const postgres = new PrismaClient();

  // Connexion SQLite
  const sqlite = new Database('prisma/dev.db', { readonly: true });

  try {
    // 1. Migrer les Clubs
    console.log('📦 Migration des clubs...');
    const clubs = sqlite.prepare('SELECT * FROM Club').all() as any[];
    for (const club of clubs) {
      await postgres.club.upsert({
        where: { id: club.id },
        create: {
          id: club.id,
          nom: club.nom,
          ville: club.ville,
          coach: club.coach,
          createdAt: new Date(club.createdAt),
        },
        update: {
          nom: club.nom,
          ville: club.ville,
          coach: club.coach,
        },
      });
    }
    console.log(`✅ ${clubs.length} clubs migrés\n`);

    // 2. Migrer les Boxeurs
    console.log('🥊 Migration des boxeurs...');
    const boxeurs = sqlite.prepare('SELECT * FROM Boxeur').all() as any[];
    for (const boxeur of boxeurs) {
      await postgres.boxeur.upsert({
        where: { id: boxeur.id },
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
          infoIncomplete: boxeur.infoIncomplete === 1,
          createdAt: new Date(boxeur.createdAt),
          updatedAt: new Date(boxeur.updatedAt),
        },
        update: {
          nom: boxeur.nom,
          prenom: boxeur.prenom,
          dateNaissance: new Date(boxeur.dateNaissance),
          sexe: boxeur.sexe,
          poids: boxeur.poids,
          gant: boxeur.gant,
          categoriePoids: boxeur.categoriePoids,
          categorieAge: boxeur.categorieAge,
          infoIncomplete: boxeur.infoIncomplete === 1,
        },
      });
    }
    console.log(`✅ ${boxeurs.length} boxeurs migrés\n`);

    // 3. Migrer les Tournois
    console.log('🏆 Migration des tournois...');
    const tournois = sqlite.prepare('SELECT * FROM Tournoi').all() as any[];
    for (const tournoi of tournois) {
      await postgres.tournoi.upsert({
        where: { id: tournoi.id },
        create: {
          id: tournoi.id,
          nom: tournoi.nom,
          date: new Date(tournoi.date),
          createdAt: new Date(tournoi.createdAt),
          updatedAt: new Date(tournoi.updatedAt),
        },
        update: {
          nom: tournoi.nom,
          date: new Date(tournoi.date),
        },
      });
    }
    console.log(`✅ ${tournois.length} tournois migrés\n`);

    // 4. Migrer les relations Tournoi-Boxeur
    console.log('🔗 Migration des inscriptions tournoi-boxeur...');
    const tournoiBoxeurs = sqlite.prepare('SELECT * FROM TournoiBoxeur').all() as any[];
    for (const tb of tournoiBoxeurs) {
      try {
        await postgres.tournoiBoxeur.create({
          data: {
            tournoiId: tb.tournoiId,
            boxeurId: tb.boxeurId,
          },
        });
      } catch (error: any) {
        // Ignorer si déjà existe
        if (!error.message.includes('Unique constraint')) {
          throw error;
        }
      }
    }
    console.log(`✅ ${tournoiBoxeurs.length} inscriptions migrées\n`);

    // 5. Migrer les Matchs
    console.log('🥊 Migration des matchs...');
    const matches = sqlite.prepare('SELECT * FROM Match').all() as any[];
    for (const match of matches) {
      await postgres.match.upsert({
        where: { id: match.id },
        create: {
          id: match.id,
          tournoiId: match.tournoiId,
          boxeur1Id: match.boxeur1Id,
          boxeur2Id: match.boxeur2Id,
          matchType: match.matchType,
          sexe: match.sexe || 'M',
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
          displayOrder: match.displayOrder || 0,
          createdAt: new Date(match.createdAt),
          updatedAt: new Date(match.updatedAt),
        },
        update: {
          boxeur1Id: match.boxeur1Id,
          boxeur2Id: match.boxeur2Id,
          status: match.status,
          winnerId: match.winnerId,
        },
      });
    }
    console.log(`✅ ${matches.length} matchs migrés\n`);

    console.log('🎉 Migration terminée avec succès !');
    console.log(`\nRésumé :`);
    console.log(`  - ${clubs.length} clubs`);
    console.log(`  - ${boxeurs.length} boxeurs`);
    console.log(`  - ${tournois.length} tournois`);
    console.log(`  - ${tournoiBoxeurs.length} inscriptions`);
    console.log(`  - ${matches.length} matchs`);

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    sqlite.close();
    await postgres.$disconnect();
  }
}

migrate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
