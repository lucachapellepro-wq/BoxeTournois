import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("📋 Liste des clubs:\n");

  const clubs = await prisma.club.findMany({
    include: {
      _count: {
        select: { boxeurs: true }
      }
    }
  });

  if (clubs.length === 0) {
    console.log("Aucun club trouvé.");
    return;
  }

  clubs.forEach((club) => {
    console.log(`🥊 Club #${club.id}`);
    console.log(`   Nom: ${club.nom}`);
    console.log(`   Ville: ${club.ville}`);
    console.log(`   Coach: ${club.coach || "—"}`);
    console.log(`   Nombre de tireurs: ${club._count.boxeurs}`);
    console.log("");
  });

  console.log(`Total: ${clubs.length} club(s)`);
}

main()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
