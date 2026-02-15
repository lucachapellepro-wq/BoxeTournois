import { prisma } from "@/lib/prisma";
import { getCategorieAge, getCategoriePoids } from "@/lib/categories";
import { NextRequest, NextResponse } from "next/server";
import { Boxeur, Club } from "@prisma/client";
import { z } from "zod";

const boxeurSchema = z.object({
  nom: z.string().min(1, "Nom obligatoire").max(100),
  prenom: z.string().min(1, "Prénom obligatoire").max(100),
  anneeNaissance: z.string().regex(/^\d{4}$/, "Année de naissance invalide"),
  sexe: z.enum(["M", "F"], { message: "Sexe invalide (M ou F)" }),
  poids: z.string().regex(/^\d+(\.\d+)?$/, "Poids invalide"),
  gant: z.string().min(1, "Gant obligatoire"),
  clubId: z.string().regex(/^\d+$/, "Club invalide"),
  typeCompetition: z.enum(["TOURNOI", "INTERCLUB"]).optional().default("TOURNOI"),
});

type BoxeurWithClub = Boxeur & { club: Club };

// GET /api/boxeurs — Liste tous les tireurs
export async function GET() {
  const boxeurs: BoxeurWithClub[] = await prisma.boxeur.findMany({
    include: { club: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(boxeurs);
}

// POST /api/boxeurs — Inscrire un tireur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = boxeurSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Données invalides";
      return NextResponse.json(
        { error: firstError },
        { status: 400 },
      );
    }

    const { nom, prenom, anneeNaissance, sexe, poids, gant, clubId, typeCompetition } = parsed.data;

    const annee: number = parseInt(anneeNaissance);
    const poidsNum: number = parseFloat(poids);

    // Convertir l'année en Date (1er janvier de l'année)
    const dateNaissance: Date = new Date(annee, 0, 1);

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
      return NextResponse.json(
        {
          error: `Ce tireur existe déjà : ${existing.nom.toUpperCase()} ${existing.prenom} (${existing.club.nom})`,
        },
        { status: 409 },
      );
    }

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

    return NextResponse.json(boxeur, { status: 201 });
  } catch (error: unknown) {
    console.error("Erreur création tireur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du tireur" },
      { status: 500 },
    );
  }
}
