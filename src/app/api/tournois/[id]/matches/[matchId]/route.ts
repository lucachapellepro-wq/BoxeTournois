import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiBadRequest, apiNotFound, apiError, parseId, safeJson, logApiError } from "@/lib/api-response";

const patchMatchSchema = z.object({
  boxeur2Id: z.number().int().positive("boxeur2Id invalide"),
});

const putMatchSchema = z.object({
  winnerId: z.number().int().positive("winnerId invalide").optional(),
  status: z.enum(["PENDING", "COMPLETED", "FORFEIT"]).optional(),
});

// GET /api/tournois/[id]/matches/[matchId] - Récupérer un match
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  const { id, matchId } = await params;
  const tournoiId = parseId(id);
  const matchIdNum = parseId(matchId);
  if (!tournoiId || !matchIdNum) return apiBadRequest("ID invalide");

  try {
    const match = await prisma.match.findUnique({
      where: { id: matchIdNum },
      include: {
        boxeur1: { include: { club: true } },
        boxeur2: { include: { club: true } },
        winner: true,
        nextMatch: true,
      },
    });

    if (!match || match.tournoiId !== tournoiId) {
      return apiNotFound("Match non trouvé");
    }

    return apiSuccess(match);
  } catch (error) {
    logApiError("Erreur récupération match:", error);
    return apiError("Erreur lors de la récupération");
  }
}

// PATCH /api/tournois/[id]/matches/[matchId] - Ajouter boxeur2 à un match existant
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  const { id, matchId } = await params;
  const tournoiId = parseId(id);
  const matchIdNum = parseId(matchId);
  if (!tournoiId || !matchIdNum) return apiBadRequest("ID invalide");

  try {
    const body = await safeJson(request);
    if (!body) return apiBadRequest("JSON invalide");
    const parsed = patchMatchSchema.safeParse(body);
    if (!parsed.success) {
      return apiBadRequest(parsed.error.issues[0]?.message || "boxeur2Id invalide");
    }
    const { boxeur2Id } = parsed.data;

    const match = await prisma.match.findUnique({
      where: { id: matchIdNum },
    });

    if (!match || match.tournoiId !== tournoiId) {
      return apiNotFound("Match non trouvé");
    }

    if (match.boxeur2Id) {
      return apiBadRequest("Ce match a déjà un boxeur2");
    }

    if (match.boxeur1Id === boxeur2Id) {
      return apiBadRequest("Un boxeur ne peut pas s'affronter lui-même");
    }

    // Vérifier que le boxeur existe et est dans le tournoi
    const boxeur2 = await prisma.boxeur.findFirst({
      where: {
        id: boxeur2Id,
        tournois: { some: { tournoiId } },
      },
    });

    if (!boxeur2) {
      return apiNotFound("Boxeur non trouvé dans ce tournoi");
    }

    const updatedMatch = await prisma.match.update({
      where: { id: matchIdNum },
      data: {
        boxeur2Id,
        boxeur2Manual: true,
      },
      include: {
        boxeur1: { include: { club: true } },
        boxeur2: { include: { club: true } },
      },
    });

    return apiSuccess(updatedMatch);
  } catch (error) {
    logApiError("Erreur ajout boxeur2:", error);
    return apiError("Erreur lors de l'ajout du boxeur2");
  }
}

// PUT /api/tournois/[id]/matches/[matchId] - Mettre à jour le résultat
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  const { id, matchId } = await params;
  const tournoiId = parseId(id);
  const matchIdNum = parseId(matchId);
  if (!tournoiId || !matchIdNum) return apiBadRequest("ID invalide");

  try {
    const body = await safeJson(request);
    if (!body) return apiBadRequest("JSON invalide");
    const parsed = putMatchSchema.safeParse(body);
    if (!parsed.success) {
      return apiBadRequest(parsed.error.issues[0]?.message || "Données invalides");
    }
    const { winnerId, status } = parsed.data;

    // FORFEIT nécessite un winnerId pour savoir qui avance
    if (status === "FORFEIT" && !winnerId) {
      return apiBadRequest("Un forfait nécessite de désigner le vainqueur (winnerId)");
    }

    // Récupérer le match actuel
    const currentMatch = await prisma.match.findUnique({
      where: { id: matchIdNum },
    });

    if (!currentMatch || currentMatch.tournoiId !== tournoiId) {
      return apiNotFound("Match non trouvé");
    }

    // Valider que winnerId est bien l'un des participants
    if (
      winnerId &&
      winnerId !== currentMatch.boxeur1Id &&
      winnerId !== currentMatch.boxeur2Id
    ) {
      return apiBadRequest("Le gagnant doit être l'un des participants");
    }

    // Mettre à jour le match en transaction
    const updatedMatch = await prisma.$transaction(async (tx) => {
      // Mettre à jour le match (reset winnerId si retour à PENDING)
      const match = await tx.match.update({
        where: { id: matchIdNum },
        data: {
          winnerId: status === "PENDING" ? null : winnerId,
          status: status || "COMPLETED",
        },
        include: {
          boxeur1: { include: { club: true } },
          boxeur2: { include: { club: true } },
          winner: true,
        },
      });

      // Propagation bracket : propager le gagnant ou nettoyer si PENDING
      if (
        match.matchType === "BRACKET" &&
        match.nextMatchId &&
        match.bracketPosition !== null
      ) {
        const isFirstSlot = match.bracketPosition % 2 === 0;
        const slotField = isFirstSlot ? "boxeur1Id" : "boxeur2Id";

        if (status === "PENDING") {
          // Reset : retirer le boxeur propagé dans le nextMatch
          await tx.match.update({
            where: { id: match.nextMatchId },
            data: { [slotField]: null },
          });
        } else if (winnerId) {
          // Propager le gagnant dans le nextMatch
          await tx.match.update({
            where: { id: match.nextMatchId },
            data: { [slotField]: winnerId },
          });
        }
      }

      return match;
    });

    return apiSuccess(updatedMatch);
  } catch (error) {
    logApiError("Erreur mise à jour match:", error);
    return apiError("Erreur lors de la mise à jour");
  }
}

// DELETE /api/tournois/[id]/matches/[matchId] - Supprimer un match
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  const { id, matchId } = await params;
  const tournoiId = parseId(id);
  const matchIdNum = parseId(matchId);
  if (!tournoiId || !matchIdNum) return apiBadRequest("ID invalide");

  try {
    const match = await prisma.match.findUnique({
      where: { id: matchIdNum },
    });

    if (!match || match.tournoiId !== tournoiId) {
      return apiNotFound("Match non trouvé");
    }

    await prisma.match.delete({
      where: { id: matchIdNum },
    });

    return apiSuccess({ message: "Match supprimé" });
  } catch (error) {
    logApiError("Erreur suppression match:", error);
    return apiError("Erreur lors de la suppression");
  }
}
