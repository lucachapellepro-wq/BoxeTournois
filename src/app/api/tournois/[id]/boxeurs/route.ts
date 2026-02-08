import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// POST /api/tournois/[id]/boxeurs - Ajouter un boxeur au tournoi
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { boxeurId } = body;

    if (!boxeurId) {
      return NextResponse.json(
        { error: "boxeurId requis" },
        { status: 400 }
      );
    }

    // Vérifier que le tournoi existe
    const tournoi = await prisma.tournoi.findUnique({
      where: { id: parseInt(id) },
    });

    if (!tournoi) {
      return NextResponse.json(
        { error: "Tournoi non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que le boxeur existe
    const boxeur = await prisma.boxeur.findUnique({
      where: { id: parseInt(boxeurId) },
    });

    if (!boxeur) {
      return NextResponse.json(
        { error: "Boxeur non trouvé" },
        { status: 404 }
      );
    }

    // Ajouter le boxeur au tournoi
    const tournoiBoxeur = await prisma.tournoiBoxeur.create({
      data: {
        tournoiId: parseInt(id),
        boxeurId: parseInt(boxeurId),
      },
    });

    return NextResponse.json(tournoiBoxeur, { status: 201 });
  } catch (error: unknown) {
    // Si c'est une erreur de contrainte unique (boxeur déjà inscrit)
    if (error instanceof Error && "code" in error && (error as { code: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Ce boxeur est déjà inscrit au tournoi" },
        { status: 400 }
      );
    }

    console.error("Erreur ajout boxeur au tournoi:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'ajout" },
      { status: 500 }
    );
  }
}
