import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const clubSchema = z.object({
  nom: z.string().min(1, "Nom obligatoire").max(100),
  ville: z.string().min(1, "Ville obligatoire").max(100),
  coach: z.string().max(100).optional().nullable(),
  couleur: z.string().max(7).optional().nullable(),
});

// GET /api/clubs
export async function GET() {
  const clubs = await prisma.club.findMany({
    orderBy: { nom: "asc" },
    include: { _count: { select: { boxeurs: true } } },
  });
  return NextResponse.json(clubs);
}

// POST /api/clubs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = clubSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Données invalides";
      return NextResponse.json(
        { error: firstError },
        { status: 400 }
      );
    }

    const { nom, ville, coach, couleur } = parsed.data;

    const club = await prisma.club.create({
      data: { nom, ville, coach: coach || null, couleur: couleur || null },
    });

    return NextResponse.json(club, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la création du club" },
      { status: 500 }
    );
  }
}
