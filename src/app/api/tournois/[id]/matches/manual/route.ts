import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiBadRequest, apiNotFound, apiError, parseId, safeJson, logApiError } from "@/lib/api-response";

const manualMatchSchema = z.object({
  boxeur1Id: z.number().int().positive("boxeur1Id invalide"),
  boxeur2Id: z.number().int().positive("boxeur2Id invalide"),
  categorieAge: z.string().optional(),
  categoriePoids: z.string().optional(),
  gant: z.string().optional(),
});

// POST /api/tournois/[id]/matches/manual - Créer un match manuel
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const tournoiId = parseId(id);
  if (!tournoiId) return apiBadRequest("ID invalide");

  try {
    const body = await safeJson(request);
    if (!body) return apiBadRequest("JSON invalide");
    const parsed = manualMatchSchema.safeParse(body);
    if (!parsed.success) {
      return apiBadRequest(parsed.error.issues[0]?.message || "Données invalides");
    }
    const { boxeur1Id, boxeur2Id, categorieAge, categoriePoids, gant } = parsed.data;

    if (boxeur1Id === boxeur2Id) {
      return apiBadRequest("Un boxeur ne peut pas s'affronter lui-même");
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
      return apiNotFound("Un ou plusieurs boxeurs non trouvés dans ce tournoi");
    }

    // Créer le match manuel (aucune restriction de catégorie)
    const match = await prisma.match.create({
      data: {
        tournoi: { connect: { id: tournoiId } },
        boxeur1: { connect: { id: boxeur1Id } },
        boxeur2: { connect: { id: boxeur2Id } },
        matchType: "POOL",
        sexe: boxeur1.sexe === boxeur2.sexe ? boxeur1.sexe : "MIXTE",
        categorieAge: categorieAge || boxeur1.categorieAge || "Non classé",
        categoriePoids: categoriePoids || boxeur1.categoriePoids || "Non classé",
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

    return apiSuccess({
      message: "Match manuel créé avec succès",
      match,
    });
  } catch (error) {
    logApiError("Erreur création match manuel:", error);
    return apiError("Erreur lors de la création du match manuel");
  }
}
