import { prisma } from "@/lib/prisma";
import { getCategorieAge, getCategoriePoids } from "@/lib/categories";
import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiBadRequest, apiNotFound, apiConflict, apiError, parseId, safeJson, logApiError } from "@/lib/api-response";

/** Schéma de validation Zod pour la mise à jour d'un boxeur */
const boxeurUpdateSchema = z.object({
  nom: z.string().min(1).max(100).optional(),
  prenom: z.string().min(1).max(100).optional(),
  anneeNaissance: z.string().regex(/^\d{4}$/, "Année invalide").refine(
    (v) => { const y = parseInt(v); return y >= 1920 && y <= new Date().getUTCFullYear(); },
    "Année hors limites"
  ).optional(),
  sexe: z.enum(["M", "F"]).optional(),
  poids: z.string().regex(/^\d+(\.\d+)?$/, "Poids invalide").refine(
    (v) => { const n = parseFloat(v); return n >= 20 && n <= 200; },
    "Poids hors limites (20-200 kg)"
  ).optional(),
  gant: z.enum(["bleu", "vert", "rouge", "blanc", "jaune", "bronze", "argent", "or"]).optional(),
  infoIncomplete: z.boolean().optional(),
  typeCompetition: z.enum(["TOURNOI", "INTERCLUB"]).optional(),
});

// DELETE /api/boxeurs/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const boxeurId = parseId(id);
  if (!boxeurId) return apiBadRequest("ID invalide");
  try {
    // Vérifier si le boxeur a des matchs (tous statuts confondus)
    const matchCount = await prisma.match.count({
      where: {
        OR: [{ boxeur1Id: boxeurId }, { boxeur2Id: boxeurId }],
      },
    });
    if (matchCount > 0) {
      return apiConflict(`Ce tireur a ${matchCount} combat(s) associé(s). Retirez-le des tournois d'abord.`);
    }

    await prisma.boxeur.delete({ where: { id: boxeurId } });
    return apiSuccess({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && (error as { code: string }).code === "P2025") {
      return apiNotFound("Boxeur non trouvé");
    }
    logApiError("Erreur suppression boxeur:", error);
    return apiError("Erreur lors de la suppression");
  }
}

// PUT /api/boxeurs/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const boxeurId = parseId(id);
  if (!boxeurId) return apiBadRequest("ID invalide");
  try {
    const body = await safeJson(request);
    if (!body) return apiBadRequest("JSON invalide");
    const parsed = boxeurUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return apiBadRequest(parsed.error.issues[0]?.message || "Données invalides");
    }
    const { nom, prenom, anneeNaissance, poids, gant, sexe, infoIncomplete, typeCompetition } = parsed.data;

    // Préparer les données à mettre à jour
    const updateData: {
      nom?: string;
      prenom?: string;
      dateNaissance?: Date;
      poids?: number;
      gant?: string;
      sexe?: string;
      categorieAge?: string;
      categoriePoids?: string;
      infoIncomplete?: boolean;
      typeCompetition?: string;
    } = {};

    if (nom !== undefined) updateData.nom = nom;
    if (prenom !== undefined) updateData.prenom = prenom;
    if (sexe !== undefined) updateData.sexe = sexe;
    if (gant !== undefined) updateData.gant = gant;
    if (typeCompetition !== undefined) updateData.typeCompetition = typeCompetition;
    if (typeof infoIncomplete === "boolean") updateData.infoIncomplete = infoIncomplete;

    // Si année de naissance modifiée, convertir en Date
    if (anneeNaissance) {
      const annee: number = parseInt(anneeNaissance);
      updateData.dateNaissance = new Date(Date.UTC(annee, 0, 1));
      updateData.categorieAge = getCategorieAge(annee);
    }

    if (poids) {
      updateData.poids = parseFloat(poids);
    }

    // Recalculer categoriePoids si poids, sexe ou anneeNaissance change
    if (poids || sexe || anneeNaissance) {
      const currentBoxeur = await prisma.boxeur.findUnique({
        where: { id: boxeurId },
      });

      if (!currentBoxeur) {
        return apiNotFound("Boxeur non trouvé");
      }

      const poidsToUse = poids ? parseFloat(poids) : currentBoxeur.poids;
      const sexeToUse = sexe || currentBoxeur.sexe;
      if (!anneeNaissance && currentBoxeur.dateNaissance == null) {
        return apiBadRequest("Date de naissance manquante, impossible de recalculer la catégorie");
      }
      const anneeToUse = anneeNaissance
        ? parseInt(anneeNaissance)
        : currentBoxeur.dateNaissance!.getUTCFullYear();

      updateData.categoriePoids = getCategoriePoids(
        poidsToUse,
        sexeToUse,
        anneeToUse
      );
    }

    if (Object.keys(updateData).length === 0) {
      return apiBadRequest("Aucune donnée à mettre à jour");
    }

    const boxeur = await prisma.boxeur.update({
      where: { id: boxeurId },
      data: updateData,
      include: { club: true },
    });

    return apiSuccess(boxeur);
  } catch (error) {
    logApiError("Erreur mise à jour boxeur:", error);
    return apiError("Erreur lors de la mise à jour");
  }
}
