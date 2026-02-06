import { prisma } from "../src/lib/prisma";

async function main() {
  const boxeurs = await prisma.boxeur.findMany({
    where: {
      club: {
        nom: {
          contains: "BOURG",
        },
      },
      nom: {
        contains: "GILAB",
      },
    },
    include: {
      club: true,
    },
  });

  console.log("Boxeurs trouvés avec 'GILAB' dans le nom:");
  if (boxeurs.length === 0) {
    console.log("Aucun boxeur trouvé");
  }
  boxeurs.forEach((b) => {
    console.log(
      `- ID: ${b.id} - ${b.prenom} ${b.nom} - ${b.sexe}${b.poids}kg - gant ${b.gant}`
    );
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
