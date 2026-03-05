import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiBadRequest, apiNotFound, apiError, parseId, safeJson, logApiError } from "@/lib/api-response";

const batchAddSchema = z.object({
  boxeurIds: z.array(z.number().int().positive()).min(1).max(500),
});

const singleAddSchema = z.object({
  boxeurId: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]),
});

// POST /api/tournois/[id]/boxeurs - Ajouter un boxeur au tournoi
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tournoiId = parseId(id);
  if (!tournoiId) return apiBadRequest("ID tournoi invalide");

  try {
    const body = await safeJson(request);
    if (!body) return apiBadRequest("JSON invalide");

    // ── Batch add : tableau de boxeurIds ──
    const batchParsed = batchAddSchema.safeParse(body);
    if (batchParsed.success) {
      const ids = batchParsed.data.boxeurIds;

      const tournoi = await prisma.tournoi.findUnique({ where: { id: tournoiId } });
      if (!tournoi) return apiNotFound("Tournoi non trouvé");

      // Vérifier que tous les boxeurs existent
      const existingBoxeurs = await prisma.boxeur.findMany({
        where: { id: { in: ids } },
        select: { id: true },
      });
      const existingIds = new Set(existingBoxeurs.map((b) => b.id));
      const invalidIds = ids.filter((id) => !existingIds.has(id));
      if (invalidIds.length > 0) {
        return apiBadRequest(`Boxeur(s) introuvable(s) : ${invalidIds.join(", ")}`);
      }

      const result = await prisma.tournoiBoxeur.createMany({
        data: ids.map((bid) => ({ tournoiId, boxeurId: bid })),
        skipDuplicates: true,
      });

      return apiSuccess({ added: result.count }, 201);
    }

    // ── Single add : un seul boxeurId ──
    const singleParsed = singleAddSchema.safeParse(body);
    if (!singleParsed.success) {
      return apiBadRequest("boxeurId (number) ou boxeurIds (number[]) requis");
    }

    const boxeurIdNum = typeof singleParsed.data.boxeurId === "string"
      ? parseId(singleParsed.data.boxeurId)
      : singleParsed.data.boxeurId;
    if (!boxeurIdNum) return apiBadRequest("boxeurId invalide");

    // Vérifier que le tournoi existe
    const tournoi = await prisma.tournoi.findUnique({
      where: { id: tournoiId },
    });

    if (!tournoi) {
      return apiNotFound("Tournoi non trouvé");
    }

    // Vérifier que le boxeur existe
    const boxeur = await prisma.boxeur.findUnique({
      where: { id: boxeurIdNum },
    });

    if (!boxeur) {
      return apiNotFound("Boxeur non trouvé");
    }

    // Ajouter le boxeur au tournoi
    const tournoiBoxeur = await prisma.tournoiBoxeur.create({
      data: {
        tournoiId,
        boxeurId: boxeurIdNum,
      },
    });

    return apiSuccess(tournoiBoxeur, 201);
  } catch (error: unknown) {
    // Si c'est une erreur de contrainte unique (boxeur déjà inscrit)
    if (error instanceof Error && "code" in error && (error as { code: string }).code === "P2002") {
      return apiBadRequest("Ce boxeur est déjà inscrit au tournoi");
    }

    logApiError("Erreur ajout boxeur au tournoi:", error);
    return apiError("Erreur lors de l'ajout");
  }
}
