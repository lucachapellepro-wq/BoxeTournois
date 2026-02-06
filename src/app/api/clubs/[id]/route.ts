import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/clubs/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const club = await prisma.club.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: { boxeurs: true },
        },
      },
    });

    if (!club) {
      return NextResponse.json({ error: "Club non trouvé" }, { status: 404 });
    }

    return NextResponse.json(club);
  } catch (error) {
    console.error("Erreur récupération club:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération" },
      { status: 500 }
    );
  }
}

// PUT /api/clubs/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { nom, ville, coach } = body;

    const updateData: {
      nom?: string;
      ville?: string;
      coach?: string | null;
    } = {};

    if (nom) updateData.nom = nom;
    if (ville) updateData.ville = ville;
    if (coach !== undefined) updateData.coach = coach || null;

    const club = await prisma.club.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        _count: {
          select: { boxeurs: true },
        },
      },
    });

    return NextResponse.json(club);
  } catch (error) {
    console.error("Erreur mise à jour club:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
