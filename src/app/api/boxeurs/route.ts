import { prisma } from "@/lib/prisma";
import { getCategorieAge, getCategoriePoids } from "@/lib/categories";
import { NextRequest, NextResponse } from "next/server";
import { Boxeur, Club } from "@prisma/client";

// Types pour la requête
interface BoxeurCreateInput {
  nom: string;
  prenom: string;
  anneeNaissance: string;
  sexe: string;
  poids: string;
  gant: string;
  clubId: string;
  typeCompetition?: string;
}

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
    const body: BoxeurCreateInput = await request.json();
    const {
      nom,
      prenom,
      anneeNaissance,
      sexe,
      poids,
      gant,
      clubId,
      typeCompetition,
    }: BoxeurCreateInput = body;

    if (
      !nom ||
      !prenom ||
      !anneeNaissance ||
      !sexe ||
      !poids ||
      !gant ||
      !clubId
    ) {
      return NextResponse.json(
        { error: "Tous les champs sont obligatoires" },
        { status: 400 },
      );
    }

    const annee: number = parseInt(anneeNaissance);
    const poidsNum: number = parseFloat(poids);

    // Convertir l'année en Date (1er janvier de l'année)
    const dateNaissance: Date = new Date(annee, 0, 1);

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
