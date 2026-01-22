import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const competitorSchema = z.object({
  name: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  url: z.string().url().optional(),
  source: z.string().min(1).optional(),
  stars: z.number().min(1).max(5).optional(),
  isMonitored: z.boolean().optional(),
  tags: z.string().optional(),
});

// PUT - Mettre à jour un concurrent
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = competitorSchema.parse(body);

    const competitor = await prisma.competitor.update({
      where: { id },
      data: validated,
    });

    return NextResponse.json({
      id: competitor.id,
      name: competitor.name,
      location: competitor.location,
      price: 0,
      stars: competitor.stars || 0,
      isMyHotel: false,
      isMonitored: competitor.isMonitored,
      url: competitor.url || undefined,
      source: competitor.source,
      tags: competitor.tags || undefined,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un concurrent
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: "ID du concurrent manquant" },
        { status: 400 }
      );
    }

    // Vérifier que le concurrent existe avant de le supprimer
    const competitor = await prisma.competitor.findUnique({
      where: { id },
    });

    if (!competitor) {
      console.log(`⚠️ Tentative de suppression d'un concurrent inexistant: ${id}`);
      return NextResponse.json(
        { error: "Concurrent introuvable" },
        { status: 404 }
      );
    }

    // Supprimer le concurrent
    try {
      await prisma.competitor.delete({
        where: { id },
      });
      console.log(`✅ Concurrent ${id} supprimé avec succès`);
      return NextResponse.json({ success: true, message: "Concurrent supprimé avec succès" });
    } catch (deleteError: any) {
      // Gérer l'erreur Prisma P2025 (record not found)
      if (deleteError?.code === "P2025") {
        console.log(`⚠️ Concurrent ${id} déjà supprimé (P2025)`);
        return NextResponse.json(
          { error: "Ce concurrent a déjà été supprimé" },
          { status: 404 }
        );
      }
      throw deleteError;
    }
  } catch (error) {
    console.error("Erreur lors de la suppression du concurrent:", error);
    
    // Gérer les erreurs Prisma spécifiques
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; message: string };
      if (prismaError.code === "P2025") {
        return NextResponse.json(
          { error: "Concurrent introuvable ou déjà supprimé" },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
