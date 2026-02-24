import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { apiSuccess, apiBadRequest, apiError, parseId, logApiError } from "@/lib/api-response";

// GET /api/tournois/[id]/matches - Récupérer tous les matchs
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tournoiId = parseId(id);
  if (!tournoiId) return apiBadRequest("ID invalide");

  const { searchParams } = new URL(request.url);
  const withStats = searchParams.get("stats") === "true";

  try {
    const matches = await prisma.match.findMany({
      where: { tournoiId },
      include: {
        boxeur1: {
          include: { club: true },
        },
        boxeur2: {
          include: { club: true },
        },
        winner: true,
        nextMatch: true,
      },
      orderBy: { displayOrder: "asc" },
    });

    if (!withStats) return apiSuccess(matches);

    // Stats calculées depuis les matchs déjà chargés (évite race condition + requêtes N+1)
    const byType = { BRACKET: 0, POOL: 0 };
    const byStatus = { PENDING: 0, COMPLETED: 0, FORFEIT: 0 };
    for (const m of matches) {
      if (m.matchType in byType) byType[m.matchType as keyof typeof byType]++;
      if (m.status in byStatus) byStatus[m.status as keyof typeof byStatus]++;
    }

    const stats = {
      total: matches.length,
      byType,
      byStatus,
    };

    return apiSuccess({ matches, stats });
  } catch (error) {
    logApiError("Erreur récupération matchs:", error);
    return apiError("Erreur lors de la récupération");
  }
}

// DELETE /api/tournois/[id]/matches - Supprimer tous les matchs
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tournoiId = parseId(id);
  if (!tournoiId) return apiBadRequest("ID invalide");

  try {
    // Vérifier s'il y a des matchs terminés avec résultat
    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";

    if (!force) {
      const completedCount = await prisma.match.count({
        where: { tournoiId, status: "COMPLETED" },
      });
      if (completedCount > 0) {
        return apiBadRequest(
          `${completedCount} match(s) terminé(s) avec résultat. Ajoutez ?force=true pour confirmer la suppression.`
        );
      }
    }

    const result = await prisma.match.deleteMany({
      where: { tournoiId },
    });

    return apiSuccess({
      success: true,
      deleted: result.count,
    });
  } catch (error) {
    logApiError("Erreur suppression matchs:", error);
    return apiError("Erreur lors de la suppression");
  }
}
