import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// POST /api/tournois/[id]/matches/manual - Créer un match manuel
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { boxeur1Id, boxeur2Id, categorieAge, categoriePoids, gant } = body;

    const tournoiId = parseInt(id);

    // Validation
    if (!boxeur1Id || !boxeur2Id) {
      return NextResponse.json(
        { error: "Les deux boxeurs sont requis" },
        { status: 400 }
      );
    }

    if (boxeur1Id === boxeur2Id) {
      return NextResponse.json(
        { error: "Un boxeur ne peut pas s'affronter lui-même" },
        { status: 400 }
      );
    }

    // Vérifier que les boxeurs existent et sont dans le tournoi
    const [boxeur1, boxeur2] = await Promise.all([
      prisma.boxeur.findFirst({
        where: {
          id: boxeur1Id,
          tournois: { some: { tournoiId } },
        },
        include: { club: true },
      }),
      prisma.boxeur.findFirst({
        where: {
          id: boxeur2Id,
          tournois: { some: { tournoiId } },
        },
        include: { club: true },
      }),
    ]);

    if (!boxeur1 || !boxeur2) {
      return NextResponse.json(
        { error: "Un ou plusieurs boxeurs non trouvés dans ce tournoi" },
        { status: 404 }
      );
    }

    // Vérifier que les boxeurs ont la même catégorie de poids
    if (boxeur1.categoriePoids !== boxeur2.categoriePoids) {
      return NextResponse.json(
        { error: "Les boxeurs doivent avoir la même catégorie de poids" },
        { status: 400 }
      );
    }

    // Créer le match manuel
    const match = await prisma.match.create({
      data: {
        tournoi: { connect: { id: tournoiId } },
        boxeur1: { connect: { id: boxeur1Id } },
        boxeur2: { connect: { id: boxeur2Id } },
        matchType: "POOL", // Les matchs manuels sont considérés comme des matchs de poule
        categorieAge: categorieAge || boxeur1.categorieAge,
        categoriePoids: boxeur1.categoriePoids,
        gant: gant || boxeur1.gant,
        categoryDisplay: `${boxeur1.categorieAge} - ${boxeur1.categoriePoids}`,
        poolName: "MANUEL",
        displayOrder: 999, // Les matchs manuels sont affichés en dernier
      },
      include: {
        boxeur1: { include: { club: true } },
        boxeur2: { include: { club: true } },
      },
    });

    return NextResponse.json({
      message: "Match manuel créé avec succès",
      match,
    });
  } catch (error) {
    console.error("Erreur création match manuel:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du match manuel" },
      { status: 500 }
    );
  }
}
