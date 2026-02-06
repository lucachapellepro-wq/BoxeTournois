import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/tournois/[id] - Récupérer un tournoi
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const tournoi = await prisma.tournoi.findUnique({
      where: { id: parseInt(id) },
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
      },
    });

    if (!tournoi) {
      return NextResponse.json(
        { error: "Tournoi non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(tournoi);
  } catch (error) {
    console.error("Erreur GET tournoi:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du tournoi" },
      { status: 500 }
    );
  }
}

// PUT /api/tournois/[id] - Mettre à jour un tournoi
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { nom, date } = body;

    const updateData: { nom?: string; date?: Date } = {};
    if (nom) updateData.nom = nom;
    if (date) updateData.date = new Date(date);

    const tournoi = await prisma.tournoi.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        _count: {
          select: { boxeurs: true },
        },
      },
    });

    return NextResponse.json(tournoi);
  } catch (error) {
    console.error("Erreur PUT tournoi:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du tournoi" },
      { status: 500 }
    );
  }
}

// DELETE /api/tournois/[id] - Supprimer un tournoi
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.tournoi.delete({
      where: { id: parseInt(id) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE tournoi:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du tournoi" },
      { status: 500 }
    );
  }
}
