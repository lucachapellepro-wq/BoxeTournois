import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiBadRequest, apiError, safeJson } from "@/lib/api-response";

/** Schéma de validation Zod pour la création d'un club */
const clubSchema = z.object({
  nom: z.string().min(1, "Nom obligatoire").max(100),
  ville: z.string().min(1, "Ville obligatoire").max(100),
  coach: z.string().max(100).optional().nullable(),
  couleur: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Couleur hex invalide").optional().nullable().or(z.literal("")),
});

// GET /api/clubs
export async function GET() {
  try {
    const clubs = await prisma.club.findMany({
      orderBy: { nom: "asc" },
      include: { _count: { select: { boxeurs: true } } },
    });
    return apiSuccess(clubs);
  } catch {
    return apiError("Erreur lors de la récupération des clubs");
  }
}

// POST /api/clubs
export async function POST(request: NextRequest) {
  try {
    const body = await safeJson(request);
    if (!body) return apiBadRequest("JSON invalide");
    const parsed = clubSchema.safeParse(body);

    if (!parsed.success) {
      return apiBadRequest(parsed.error.issues[0]?.message || "Données invalides");
    }

    const { nom, ville, coach, couleur } = parsed.data;

    const club = await prisma.club.create({
      data: { nom, ville, coach: coach || null, couleur: couleur || null },
    });

    return apiSuccess(club, 201);
  } catch {
    return apiError("Erreur lors de la création du club");
  }
}
