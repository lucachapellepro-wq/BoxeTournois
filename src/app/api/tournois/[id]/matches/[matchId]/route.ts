import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/tournois/[id]/matches/[matchId] - Récupérer un match
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  const { matchId } = await params;

  try {
    const match = await prisma.match.findUnique({
      where: { id: parseInt(matchId) },
      include: {
        boxeur1: { include: { club: true } },
        boxeur2: { include: { club: true } },
        winner: true,
        nextMatch: true,
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: "Match non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(match);
  } catch (error) {
    console.error("Erreur récupération match:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération" },
      { status: 500 }
    );
  }
}

// PATCH /api/tournois/[id]/matches/[matchId] - Ajouter boxeur2 à un match existant
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  const { id, matchId } = await params;

  try {
    const body = await request.json();
    const { boxeur2Id } = body;

    if (!boxeur2Id) {
      return NextResponse.json(
        { error: "boxeur2Id est requis" },
        { status: 400 }
      );
    }

    const match = await prisma.match.findUnique({
      where: { id: parseInt(matchId) },
    });

    if (!match) {
      return NextResponse.json(
        { error: "Match non trouvé" },
        { status: 404 }
      );
    }

    if (match.boxeur2Id) {
      return NextResponse.json(
        { error: "Ce match a déjà un boxeur2" },
        { status: 400 }
      );
    }

    if (match.boxeur1Id === boxeur2Id) {
      return NextResponse.json(
        { error: "Un boxeur ne peut pas s'affronter lui-même" },
        { status: 400 }
      );
    }

    // Vérifier que le boxeur existe et est dans le tournoi
    const boxeur2 = await prisma.boxeur.findFirst({
      where: {
        id: boxeur2Id,
        tournois: { some: { tournoiId: parseInt(id) } },
      },
    });

    if (!boxeur2) {
      return NextResponse.json(
        { error: "Boxeur non trouvé dans ce tournoi" },
        { status: 404 }
      );
    }

    const updatedMatch = await prisma.match.update({
      where: { id: parseInt(matchId) },
      data: {
        boxeur2Id,
        boxeur2Manual: true,
      },
      include: {
        boxeur1: { include: { club: true } },
        boxeur2: { include: { club: true } },
      },
    });

    return NextResponse.json(updatedMatch);
  } catch (error) {
    console.error("Erreur ajout boxeur2:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'ajout du boxeur2" },
      { status: 500 }
    );
  }
}

// PUT /api/tournois/[id]/matches/[matchId] - Mettre à jour le résultat
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  const { matchId } = await params;

  try {
    const body = await request.json();
    const { winnerId, status } = body;

    // Récupérer le match actuel
    const currentMatch = await prisma.match.findUnique({
      where: { id: parseInt(matchId) },
    });

    if (!currentMatch) {
      return NextResponse.json(
        { error: "Match non trouvé" },
        { status: 404 }
      );
    }

    // Valider que winnerId est bien l'un des participants
    if (
      winnerId &&
      winnerId !== currentMatch.boxeur1Id &&
      winnerId !== currentMatch.boxeur2Id
    ) {
      return NextResponse.json(
        { error: "Le gagnant doit être l'un des participants" },
        { status: 400 }
      );
    }

    // Mettre à jour le match en transaction
    const updatedMatch = await prisma.$transaction(async (tx) => {
      // Mettre à jour le match
      const match = await tx.match.update({
        where: { id: parseInt(matchId) },
        data: {
          winnerId,
          status: status || "COMPLETED",
        },
        include: {
          boxeur1: { include: { club: true } },
          boxeur2: { include: { club: true } },
          winner: true,
        },
      });

      // Si c'est un match de bracket et qu'il a un nextMatch, propager le gagnant
      if (
        match.matchType === "BRACKET" &&
        match.nextMatchId &&
        winnerId
      ) {
        const nextMatch = await tx.match.findUnique({
          where: { id: match.nextMatchId },
        });

        if (nextMatch) {
          // Déterminer si le gagnant va en boxeur1 ou boxeur2 du prochain match
          // Basé sur la position dans le bracket
          const isFirstSlot = (match.bracketPosition || 0) % 2 === 0;

          await tx.match.update({
            where: { id: match.nextMatchId },
            data: {
              [isFirstSlot ? "boxeur1Id" : "boxeur2Id"]: winnerId,
            },
          });
        }
      }

      return match;
    });

    return NextResponse.json(updatedMatch);
  } catch (error) {
    console.error("Erreur mise à jour match:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}

// DELETE /api/tournois/[id]/matches/[matchId] - Supprimer un match
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  const { matchId } = await params;

  try {
    const match = await prisma.match.findUnique({
      where: { id: parseInt(matchId) },
    });

    if (!match) {
      return NextResponse.json(
        { error: "Match non trouvé" },
        { status: 404 }
      );
    }

    await prisma.match.delete({
      where: { id: parseInt(matchId) },
    });

    return NextResponse.json({ message: "Match supprimé" });
  } catch (error) {
    console.error("Erreur suppression match:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
