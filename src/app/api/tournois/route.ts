import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/tournois - Liste tous les tournois
export async function GET() {
  try {
    const tournois = await prisma.tournoi.findMany({
      include: {
        _count: {
          select: { boxeurs: true },
        },
      },
      orderBy: {
        date: "desc",
      },
    });
    return NextResponse.json(tournois);
  } catch (error) {
    console.error("Erreur GET tournois:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des tournois" },
      { status: 500 }
    );
  }
}

// POST /api/tournois - Créer un nouveau tournoi
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nom, date } = body;

    if (!nom || !date) {
      return NextResponse.json(
        { error: "Nom et date obligatoires" },
        { status: 400 }
      );
    }

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

    return NextResponse.json(tournoi, { status: 201 });
  } catch (error) {
    console.error("Erreur POST tournoi:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du tournoi" },
      { status: 500 }
    );
  }
}
