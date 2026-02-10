import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { generateMatches, linkBracketMatches } from "@/lib/matchGeneration";
import { NextRequest, NextResponse } from "next/server";

// POST /api/tournois/[id]/matches/generate - Générer tous les matchs
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { regenerate } = body;

    const tournoiId = parseInt(id);

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
      return NextResponse.json(
        { error: "Tournoi non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier si des matchs existent déjà
    if (tournoi.matches.length > 0 && !regenerate) {
      return NextResponse.json(
        {
          error: "Des matchs existent déjà pour ce tournoi",
          hint: "Utilisez regenerate: true pour les régénérer",
        },
        { status: 409 }
      );
    }

    // Si régénération, supprimer tous les matchs existants
    if (regenerate && tournoi.matches.length > 0) {
      await prisma.match.deleteMany({
        where: { tournoiId },
      });
    }

    // Extraire les boxeurs
    const boxeurs = tournoi.boxeurs.map((tb) => ({
      ...tb.boxeur,
      dateNaissance: tb.boxeur.dateNaissance?.toISOString() || "",
      categoriePoids: tb.boxeur.categoriePoids || "",
      categorieAge: tb.boxeur.categorieAge || "",
    }));

    if (boxeurs.length === 0) {
      return NextResponse.json(
        { error: "Aucun boxeur inscrit au tournoi" },
        { status: 400 }
      );
    }

    // Générer les matchs (logique métier)
    const matchesData = generateMatches(boxeurs, tournoiId);

    if (matchesData.length === 0) {
      return NextResponse.json(
        {
          message: "Aucun match généré (tous les groupes ont 1 seul boxeur)",
          matches: [],
          stats: { total: 0, brackets: 0, pools: 0 },
        },
        { status: 200 }
      );
    }

    // Créer tous les matchs en transaction avec timeout étendu
    const createdMatches = await prisma.$transaction(async (tx) => {
      // Créer les matchs séquentiellement pour éviter le timeout
      const matches = [];
      for (const data of matchesData) {
        const createData: Prisma.MatchCreateInput = {
          tournoi: { connect: { id: data.tournoiId } },
          matchType: data.matchType,
          sexe: data.sexe,
          categorieAge: data.categorieAge || "",
          categoriePoids: data.categoriePoids,
          gant: data.gant || "",
          categoryDisplay: data.categoryDisplay,
          displayOrder: data.displayOrder,
        };

        if (data.boxeur1Id) {
          createData.boxeur1 = { connect: { id: data.boxeur1Id } };
        }
        if (data.boxeur2Id) {
          createData.boxeur2 = { connect: { id: data.boxeur2Id } };
        }
        if (data.bracketRound) {
          createData.bracketRound = data.bracketRound;
          createData.bracketPosition = data.bracketPosition ?? 0;
        }
        if (data.poolName) {
          createData.poolName = data.poolName;
        }

        matches.push(await tx.match.create({ data: createData }));
      }

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

        for (const link of links) {
          await tx.match.update({
            where: { id: link.id },
            data: { nextMatchId: link.nextMatchId },
          });
        }
      }

      return matches;
    }, { timeout: 30000 });

    // Calculer les stats
    const stats = {
      total: createdMatches.length,
      brackets: createdMatches.filter((m) => m.matchType === "BRACKET").length,
      pools: createdMatches.filter((m) => m.matchType === "POOL").length,
    };

    return NextResponse.json({
      message: "Matchs générés avec succès",
      matches: createdMatches,
      stats,
    });
  } catch (error) {
    console.error("Erreur génération matchs:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération" },
      { status: 500 }
    );
  }
}
