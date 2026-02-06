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

// PUT /api/tournois/[id]/matches/[matchId] - Mettre à jour le résultat
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  const { matchId } = await params;

  try {
    const body = await request.json();
    const { winnerId, score1, score2, status } = body;

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
          score1,
          score2,
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
