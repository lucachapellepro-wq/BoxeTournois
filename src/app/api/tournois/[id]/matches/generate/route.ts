import { prisma } from "@/lib/prisma";
import { generateMatches, linkBracketMatches } from "@/lib/matchGeneration";
import { NextRequest } from "next/server";
import { apiSuccess, apiBadRequest, apiNotFound, apiConflict, apiError, parseId, safeJson, logApiError } from "@/lib/api-response";

// POST /api/tournois/[id]/matches/generate - Générer tous les matchs
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tournoiId = parseId(id);
  if (!tournoiId) return apiBadRequest("ID invalide");

  try {
    const body = await safeJson<{ regenerate?: boolean }>(request);
    if (!body) return apiBadRequest("JSON invalide");
    const { regenerate } = body;

    // Vérifier si le tournoi existe
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
        matches: true,
      },
    });

    if (!tournoi) {
      return apiNotFound("Tournoi non trouvé");
    }

    // Vérifier si des matchs existent déjà
    if (tournoi.matches.length > 0 && !regenerate) {
      return apiConflict("Des matchs existent déjà pour ce tournoi. Utilisez regenerate: true pour les régénérer.");
    }

    // Extraire les boxeurs
    const boxeurs = tournoi.boxeurs.map((tb) => ({
      ...tb.boxeur,
      dateNaissance: tb.boxeur.dateNaissance?.toISOString() || "",
      categoriePoids: tb.boxeur.categoriePoids || "Non classé",
      categorieAge: tb.boxeur.categorieAge || "Non classé",
    }));

    if (boxeurs.length === 0) {
      return apiBadRequest("Aucun boxeur inscrit au tournoi");
    }

    // Générer les matchs (logique métier)
    const matchesData = generateMatches(boxeurs, tournoiId);

    if (matchesData.length === 0) {
      return apiSuccess({
        message: "Aucun match généré (tous les groupes ont 1 seul boxeur)",
        matches: [],
        stats: { total: 0, brackets: 0, pools: 0 },
      });
    }

    // Créer tous les matchs en transaction atomique (delete + create)
    const createdMatches = await prisma.$transaction(async (tx) => {
      // Si régénération, supprimer les anciens matchs dans la même transaction
      if (regenerate && tournoi.matches.length > 0) {
        await tx.match.deleteMany({ where: { tournoiId } });
      }

      // Créer tous les matchs en batch
      const createInputs = matchesData.map((data) => ({
        tournoiId: data.tournoiId,
        matchType: data.matchType,
        sexe: data.sexe,
        categorieAge: data.categorieAge || "",
        categoriePoids: data.categoriePoids,
        gant: data.gant || "",
        categoryDisplay: data.categoryDisplay,
        displayOrder: data.displayOrder,
        boxeur1Id: data.boxeur1Id || null,
        boxeur2Id: data.boxeur2Id || null,
        bracketRound: data.bracketRound || null,
        bracketPosition: data.bracketRound ? (data.bracketPosition ?? 0) : null,
        poolName: data.poolName || null,
      }));

      await tx.match.createMany({ data: createInputs });

      // Récupérer les matchs créés pour obtenir les IDs
      const matches = await tx.match.findMany({
        where: { tournoiId },
        orderBy: { id: "asc" },
      });

      // Lier les matchs de bracket avec nextMatchId
      const bracketMatches = matches.filter(
        (m) => m.matchType === "BRACKET" && m.bracketRound !== null
      );

      if (bracketMatches.length > 0) {
        const links = linkBracketMatches(
          bracketMatches.map((m) => ({
            id: m.id,
            bracketRound: m.bracketRound,
            bracketPosition: m.bracketPosition,
          }))
        );

        // Batch update des liens via Promise.all
        await Promise.all(
          links.map((link) =>
            tx.match.update({
              where: { id: link.id },
              data: { nextMatchId: link.nextMatchId },
            })
          )
        );
      }

      return matches;
    }, { timeout: 30000 });

    // Calculer les stats
    const stats = {
      total: createdMatches.length,
      brackets: createdMatches.filter((m) => m.matchType === "BRACKET").length,
      pools: createdMatches.filter((m) => m.matchType === "POOL").length,
    };

    return apiSuccess({
      message: "Matchs générés avec succès",
      matches: createdMatches,
      stats,
    });
  } catch (error) {
    logApiError("Erreur génération matchs:", error);
    return apiError("Erreur lors de la génération");
  }
}
