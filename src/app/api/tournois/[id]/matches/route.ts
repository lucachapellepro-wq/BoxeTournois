import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/tournois/[id]/matches - Récupérer tous les matchs
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const matches = await prisma.match.findMany({
      where: { tournoiId: parseInt(id) },
      include: {
        boxeur1: {
          include: { club: true },
        },
        boxeur2: {
          include: { club: true },
        },
        winner: true,
        nextMatch: true,
      },
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json(matches);
  } catch (error) {
    console.error("Erreur récupération matchs:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération" },
      { status: 500 }
    );
  }
}

// DELETE /api/tournois/[id]/matches - Supprimer tous les matchs
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const result = await prisma.match.deleteMany({
      where: { tournoiId: parseInt(id) },
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
    });
  } catch (error) {
    console.error("Erreur suppression matchs:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
