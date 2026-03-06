import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiBadRequest, apiNotFound, apiConflict, apiError, parseId, safeJson } from "@/lib/api-response";

/** Schéma de validation Zod pour la mise à jour d'un club */
const clubUpdateSchema = z.object({
  nom: z.string().min(1).max(100).optional(),
  ville: z.string().min(1).max(100).optional(),
  coach: z.string().max(100).optional().nullable(),
  couleur: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Couleur hex invalide").optional().nullable().or(z.literal("")),
});

// GET /api/clubs/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const clubId = parseId(id);
  if (!clubId) return apiBadRequest("ID invalide");
  try {
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        _count: {
          select: { boxeurs: true },
        },
      },
    });

    if (!club) {
      return apiNotFound("Club non trouvé");
    }

    return apiSuccess(club);
  } catch {
    return apiError("Erreur lors de la récupération");
  }
}

// PUT /api/clubs/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const clubId = parseId(id);
  if (!clubId) return apiBadRequest("ID invalide");
  try {
    const body = await safeJson(request);
    if (!body) return apiBadRequest("JSON invalide");
    const parsed = clubUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return apiBadRequest(parsed.error.issues[0]?.message || "Données invalides");
    }

    const { nom, ville, coach, couleur } = parsed.data;

    const updateData: {
      nom?: string;
      ville?: string;
      coach?: string | null;
      couleur?: string | null;
    } = {};

    if (nom !== undefined) updateData.nom = nom;
    if (ville !== undefined) updateData.ville = ville;
    if (coach !== undefined) updateData.coach = coach || null;
    if (couleur !== undefined) updateData.couleur = couleur || null;

    const club = await prisma.club.update({
      where: { id: clubId },
      data: updateData,
      include: {
        _count: {
          select: { boxeurs: true },
        },
      },
    });

    return apiSuccess(club);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return apiNotFound("Club non trouvé");
    }
    return apiError("Erreur lors de la mise à jour");
  }
}

// DELETE /api/clubs/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const clubId = parseId(id);
  if (!clubId) return apiBadRequest("ID invalide");
  try {
    // Vérifier si le club a des boxeurs
    const boxeurCount = await prisma.boxeur.count({
      where: { clubId },
    });
    if (boxeurCount > 0) {
      return apiConflict(
        `Ce club a ${boxeurCount} tireur(s). Supprimez ou réaffectez les tireurs d'abord.`
      );
    }

    await prisma.club.delete({ where: { id: clubId } });
    return apiSuccess({ success: true });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return apiNotFound("Club non trouvé");
    }
    return apiError("Erreur lors de la suppression");
  }
}
