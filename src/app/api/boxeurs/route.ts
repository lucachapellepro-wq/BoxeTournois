import { prisma } from "@/lib/prisma";
import { getCategorieAge, getCategoriePoids } from "@/lib/categories";
import { NextRequest } from "next/server";
import { Boxeur, Club } from "@prisma/client";
import { z } from "zod";
import { apiSuccess, apiBadRequest, apiConflict, apiError, safeJson, logApiError } from "@/lib/api-response";

/** Schéma de validation Zod pour la création d'un boxeur */
const boxeurSchema = z.object({
  nom: z.string().min(1, "Nom obligatoire").max(100),
  prenom: z.string().min(1, "Prénom obligatoire").max(100),
  anneeNaissance: z.string().regex(/^\d{4}$/, "Année de naissance invalide").refine(
    (v) => { const y = parseInt(v); return y >= 1920 && y <= new Date().getUTCFullYear(); },
    "Année hors limites"
  ),
  sexe: z.enum(["M", "F"], { message: "Sexe invalide (M ou F)" }),
  poids: z.string().regex(/^\d+(\.\d+)?$/, "Poids invalide").refine(
    (v) => { const n = parseFloat(v); return n >= 20 && n <= 200; },
    "Poids hors limites (20-200 kg)"
  ),
  gant: z.enum(["bleu", "vert", "rouge", "blanc", "jaune", "bronze", "argent", "or"], { message: "Gant invalide" }),
  clubId: z.string().regex(/^\d+$/, "Club invalide"),
  typeCompetition: z.enum(["TOURNOI", "INTERCLUB"]).optional().default("TOURNOI"),
});

type BoxeurWithClub = Boxeur & { club: Club };

// GET /api/boxeurs — Liste tous les tireurs (avec pagination optionnelle)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "0");
  const limit = Math.min(parseInt(searchParams.get("limit") || "0"), 200);

  try {
    // Si pas de pagination demandée, retourner tous les boxeurs (rétrocompatible)
    if (!page || !limit) {
      const boxeurs: BoxeurWithClub[] = await prisma.boxeur.findMany({
        include: { club: true },
        orderBy: { createdAt: "desc" },
      });
      return apiSuccess(boxeurs);
    }

    const skip = (page - 1) * limit;
    const [boxeurs, total] = await Promise.all([
      prisma.boxeur.findMany({
        include: { club: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.boxeur.count(),
    ]);

    return apiSuccess({ data: boxeurs, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    logApiError("Erreur récupération boxeurs:", error);
    return apiError("Erreur lors de la récupération");
  }
}

// POST /api/boxeurs — Inscrire un tireur
export async function POST(request: NextRequest) {
  try {
    const body = await safeJson(request);
    if (!body) return apiBadRequest("JSON invalide");
    const parsed = boxeurSchema.safeParse(body);

    if (!parsed.success) {
      return apiBadRequest(parsed.error.issues[0]?.message || "Données invalides");
    }

    const { nom, prenom, anneeNaissance, sexe, poids, gant, clubId, typeCompetition } = parsed.data;

    const annee: number = parseInt(anneeNaissance);
    const poidsNum: number = parseFloat(poids);

    // Convertir l'année en Date (1er janvier de l'année)
    const dateNaissance: Date = new Date(Date.UTC(annee, 0, 1));

    // Détection doublons
    const existing = await prisma.boxeur.findFirst({
      where: {
        nom: { equals: nom, mode: "insensitive" },
        prenom: { equals: prenom, mode: "insensitive" },
        dateNaissance,
      },
      include: { club: true },
    });
    if (existing) {
      return apiConflict(
        `Ce tireur existe déjà : ${existing.nom.toUpperCase()} ${existing.prenom} (${existing.club.nom})`
      );
    }

    // Vérifier que le club existe
    const club = await prisma.club.findUnique({ where: { id: parseInt(clubId) } });
    if (!club) return apiBadRequest("Club introuvable");

    const categorieAge: string = getCategorieAge(annee);
    const categoriePoids: string = getCategoriePoids(poidsNum, sexe, annee);

    const boxeur: BoxeurWithClub = await prisma.boxeur.create({
      data: {
        nom,
        prenom,
        dateNaissance,
        sexe,
        poids: poidsNum,
        gant,
        clubId: parseInt(clubId),
        categorieAge,
        categoriePoids,
        typeCompetition: typeCompetition || "TOURNOI",
      },
      include: { club: true },
    });

    return apiSuccess(boxeur, 201);
  } catch (error: unknown) {
    logApiError("Erreur création tireur:", error);
    return apiError("Erreur lors de la création du tireur");
  }
}
