import { prisma } from "@/lib/prisma";
import { getCategorieAge, getCategoriePoids } from "@/lib/categories";
import { NextRequest, NextResponse } from "next/server";

// DELETE /api/boxeurs/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.boxeur.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Boxeur non trouvé" }, { status: 404 });
  }
}

// PUT /api/boxeurs/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { nom, prenom, anneeNaissance, poids, gant, sexe, infoIncomplete } = body;

    // Préparer les données à mettre à jour
    const updateData: {
      nom?: string;
      prenom?: string;
      dateNaissance?: Date;
      poids?: number;
      gant?: string;
      sexe?: string;
      categorieAge?: string;
      categoriePoids?: string;
      infoIncomplete?: boolean;
    } = {};

    if (nom) updateData.nom = nom;
    if (prenom) updateData.prenom = prenom;
    if (sexe) updateData.sexe = sexe;
    if (gant) updateData.gant = gant;
    if (typeof infoIncomplete === "boolean") updateData.infoIncomplete = infoIncomplete;

    // Si année de naissance modifiée, convertir en Date
    if (anneeNaissance) {
      const annee: number = parseInt(anneeNaissance);
      updateData.dateNaissance = new Date(annee, 0, 1);
      updateData.categorieAge = getCategorieAge(annee);
    }

    // Si poids modifié, recalculer catégorie poids
    if (poids) {
      updateData.poids = parseFloat(poids);

      // Récupérer le boxeur actuel pour avoir sexe et année si non fournis
      const currentBoxeur = await prisma.boxeur.findUnique({
        where: { id: parseInt(id) },
      });

      if (!currentBoxeur) {
        return NextResponse.json(
          { error: "Boxeur non trouvé" },
          { status: 404 }
        );
      }

      const sexeToUse = sexe || currentBoxeur.sexe;
      const anneeToUse = anneeNaissance
        ? parseInt(anneeNaissance)
        : currentBoxeur.dateNaissance.getFullYear();

      updateData.categoriePoids = getCategoriePoids(
        parseFloat(poids),
        sexeToUse,
        anneeToUse
      );
    }

    const boxeur = await prisma.boxeur.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { club: true },
    });

    return NextResponse.json(boxeur);
  } catch (error) {
    console.error("Erreur mise à jour boxeur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
