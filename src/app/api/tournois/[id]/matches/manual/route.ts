import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// POST /api/tournois/[id]/matches/manual - Créer un match manuel
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
        { status: 400 },
      );
    }

    if (boxeur1Id === boxeur2Id) {
      return NextResponse.json(
        { error: "Un boxeur ne peut pas s'affronter lui-même" },
        { status: 400 },
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
        { status: 404 },
      );
    }

    // Créer le match manuel (aucune restriction de catégorie)
    const match = await prisma.match.create({
      data: {
        tournoi: { connect: { id: tournoiId } },
        boxeur1: { connect: { id: boxeur1Id } },
        boxeur2: { connect: { id: boxeur2Id } },
        matchType: "POOL",
        sexe: boxeur1.sexe === boxeur2.sexe ? boxeur1.sexe : "M",
        categorieAge: categorieAge || boxeur1.categorieAge || "",
        categoriePoids: categoriePoids || boxeur1.categoriePoids || "",
        gant: gant || boxeur1.gant,
        categoryDisplay: "MANUEL",
        poolName: "MANUEL",
        displayOrder: 999,
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
      { status: 500 },
    );
  }
}
