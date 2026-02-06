import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

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
    const { nom, ville, coach } = body;

    if (!nom || !ville) {
      return NextResponse.json(
        { error: "Le nom et la ville sont obligatoires" },
        { status: 400 }
      );
    }

    const club = await prisma.club.create({
      data: { nom, ville, coach: coach || null },
    });

    return NextResponse.json(club, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la création du club" },
      { status: 500 }
    );
  }
}
