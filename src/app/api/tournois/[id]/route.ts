import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { apiSuccess, apiBadRequest, apiNotFound, apiConflict, apiError, parseId, safeJson, logApiError } from "@/lib/api-response";
import { z } from "zod";

/** Schéma de validation Zod pour la mise à jour d'un tournoi */
const tournoiUpdateSchema = z.object({
  nom: z.string().min(1).max(200).optional(),
  date: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    "Date invalide"
  ).optional(),
});

// GET /api/tournois/[id] - Récupérer un tournoi
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tournoiId = parseId(id);
  if (!tournoiId) return apiBadRequest("ID invalide");
  try {
    const tournoi = await prisma.tournoi.findUnique({
      where: { id: tournoiId },
      include: {
        boxeurs: {
          include: {
            boxeur: {
              include: {
                club: true,
              },
            },
          },
        },
      },
    });

    if (!tournoi) {
      return apiNotFound("Tournoi non trouvé");
    }

    return apiSuccess(tournoi);
  } catch (error) {
    logApiError("Erreur GET tournoi:", error);
    return apiError("Erreur lors de la récupération du tournoi");
  }
}

// PUT /api/tournois/[id] - Mettre à jour un tournoi
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tournoiId = parseId(id);
  if (!tournoiId) return apiBadRequest("ID invalide");
  try {
    const body = await safeJson(request);
    if (!body) return apiBadRequest("JSON invalide");
    const parsed = tournoiUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return apiBadRequest(parsed.error.issues[0]?.message || "Données invalides");
    }

    const updateData: { nom?: string; date?: Date } = {};
    if (parsed.data.nom !== undefined) updateData.nom = parsed.data.nom;
    if (parsed.data.date !== undefined) updateData.date = new Date(parsed.data.date);

    const tournoi = await prisma.tournoi.update({
      where: { id: tournoiId },
      data: updateData,
      include: {
        _count: {
          select: { boxeurs: true },
        },
      },
    });

    return apiSuccess(tournoi);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return apiNotFound("Tournoi non trouvé");
    }
    logApiError("Erreur PUT tournoi:", error);
    return apiError("Erreur lors de la mise à jour du tournoi");
  }
}

// DELETE /api/tournois/[id] - Supprimer un tournoi
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tournoiId = parseId(id);
  if (!tournoiId) return apiBadRequest("ID invalide");
  try {
    // Vérifier si le tournoi a des matchs non terminés
    const activeMatchCount = await prisma.match.count({
      where: {
        tournoiId,
        status: "PENDING",
      },
    });
    if (activeMatchCount > 0) {
      return apiConflict(
        `Ce tournoi a ${activeMatchCount} combat(s) en attente. Supprimez les matchs d'abord.`
      );
    }

    await prisma.tournoi.delete({
      where: { id: tournoiId },
    });
    return apiSuccess({ success: true });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return apiNotFound("Tournoi non trouvé");
    }
    logApiError("Erreur DELETE tournoi:", error);
    return apiError("Erreur lors de la suppression du tournoi");
  }
}
