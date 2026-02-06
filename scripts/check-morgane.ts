import { prisma } from "../src/lib/prisma";

async function main() {
  const boxeurs = await prisma.boxeur.findMany({
    where: {
      club: {
        nom: {
          contains: "ALBERTVILLE",
        },
      },
      nom: {
        contains: "CHARM",
      },
    },
    include: {
      club: true,
    },
  });

  console.log("Boxeurs trouvés avec 'CHARM' dans le nom:");
  boxeurs.forEach((b) => {
    console.log(
      `- ${b.prenom} ${b.nom} - ${b.sexe}${b.poids}kg - gant ${b.gant}`
    );
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
