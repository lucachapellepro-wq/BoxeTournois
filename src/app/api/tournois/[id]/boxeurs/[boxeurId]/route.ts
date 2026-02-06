import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// DELETE /api/tournois/[id]/boxeurs/[boxeurId] - Retirer un boxeur du tournoi
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; boxeurId: string }> }
) {
  const { id, boxeurId } = await params;
  try {
    await prisma.tournoiBoxeur.delete({
      where: {
        tournoiId_boxeurId: {
          tournoiId: parseInt(id),
          boxeurId: parseInt(boxeurId),
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur retrait boxeur du tournoi:", error);
    return NextResponse.json(
      { error: "Erreur lors du retrait" },
      { status: 500 }
    );
  }
}
