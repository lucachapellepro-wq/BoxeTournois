import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { apiSuccess, apiBadRequest, apiNotFound, apiError, parseId, logApiError } from "@/lib/api-response";

// DELETE /api/tournois/[id]/boxeurs/[boxeurId] - Retirer un boxeur du tournoi
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; boxeurId: string }> }
) {
  const { id, boxeurId } = await params;
  const tournoiId = parseId(id);
  const boxeurIdNum = parseId(boxeurId);
  if (!tournoiId || !boxeurIdNum) return apiBadRequest("ID invalide");

  try {
    await prisma.tournoiBoxeur.delete({
      where: {
        tournoiId_boxeurId: {
          tournoiId,
          boxeurId: boxeurIdNum,
        },
      },
    });

    return apiSuccess({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && (error as { code: string }).code === "P2025") {
      return apiNotFound("Ce boxeur n'est pas inscrit à ce tournoi");
    }
    logApiError("Erreur retrait boxeur du tournoi:", error);
    return apiError("Erreur lors du retrait");
  }
}
