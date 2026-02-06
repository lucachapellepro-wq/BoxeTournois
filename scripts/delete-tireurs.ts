import { prisma } from "../src/lib/prisma";

async function main() {
  const result = await prisma.boxeur.deleteMany();
  console.log(`✓ ${result.count} tireurs supprimés`);
}

main()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
