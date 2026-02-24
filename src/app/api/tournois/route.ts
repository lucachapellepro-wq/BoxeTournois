import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { apiSuccess, apiBadRequest, apiError, safeJson, logApiError } from "@/lib/api-response";
import { z } from "zod";

/** Schéma de validation Zod pour la création d'un tournoi */
const tournoiSchema = z.object({
  nom: z.string().min(1, "Nom obligatoire").max(200),
  date: z.string().min(1, "Date obligatoire").refine(
    (val) => !isNaN(Date.parse(val)),
    "Date invalide"
  ),
});

// GET /api/tournois - Liste tous les tournois (avec pagination optionnelle)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page")) || 0;
  const limit = Math.min(Number(searchParams.get("limit")) || 0, 200);

  const includeOpts = { _count: { select: { boxeurs: true } } };
  const orderBy = { date: "desc" as const };

  try {
    // Sans pagination : retourner tous les tournois (rétrocompatible)
    if (!page || !limit) {
      const tournois = await prisma.tournoi.findMany({
        include: includeOpts,
        orderBy,
      });
      return apiSuccess(tournois);
    }

    // Avec pagination
    const skip = (page - 1) * limit;
    const [tournois, total] = await Promise.all([
      prisma.tournoi.findMany({ include: includeOpts, orderBy, skip, take: limit }),
      prisma.tournoi.count(),
    ]);

    return apiSuccess({ data: tournois, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    logApiError("Erreur GET tournois:", error);
    return apiError("Erreur lors de la récupération des tournois");
  }
}

// POST /api/tournois - Créer un nouveau tournoi
export async function POST(request: NextRequest) {
  try {
    const body = await safeJson(request);
    if (!body) return apiBadRequest("JSON invalide");
    const parsed = tournoiSchema.safeParse(body);

    if (!parsed.success) {
      return apiBadRequest(parsed.error.issues[0]?.message || "Données invalides");
    }

    const { nom, date } = parsed.data;

    const tournoi = await prisma.tournoi.create({
      data: {
        nom,
        date: new Date(date),
      },
      include: {
        _count: {
          select: { boxeurs: true },
        },
      },
    });

    return apiSuccess(tournoi, 201);
  } catch (error) {
    logApiError("Erreur POST tournoi:", error);
    return apiError("Erreur lors de la création du tournoi");
  }
}
