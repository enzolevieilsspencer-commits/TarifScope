import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const competitorSchema = z.object({
  name: z.string().min(1).optional(),
  location: z.string().optional(),
  url: z
    .string()
    .optional()
    .refine(
      (s) =>
        !s ||
        s === "" ||
        s.startsWith("https://www.booking.com/") ||
        s.startsWith("http://www.booking.com/"),
      "L'URL doit être une page hôtel Booking.com"
    ),
  source: z.string().min(1).optional(),
  stars: z.number().min(0).max(5).optional(),
  isMonitored: z.boolean().optional(),
  tags: z.string().optional(),
});

/**
 * PUT - Modifier un concurrent (table scraper "hotels", isClient = false).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = competitorSchema.parse(body);

    const existing = await prisma.scraperHotel.findFirst({
      where: { id, isClient: false },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Concurrent introuvable" },
        { status: 404 }
      );
    }

    const data: Parameters<typeof prisma.scraperHotel.update>[0]["data"] = {};
    if (validated.name != null) data.name = validated.name;
    if (validated.location != null) data.location = validated.location;
    if (validated.url != null) data.url = validated.url;
    if (validated.stars != null) data.stars = validated.stars;
    if (validated.isMonitored != null) data.isMonitored = validated.isMonitored;

    const hotel = await prisma.scraperHotel.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      id: hotel.id,
      name: hotel.name,
      location: hotel.location ?? "",
      price: 0,
      stars: hotel.stars ?? 0,
      photoUrl: hotel.photoUrl ?? undefined,
      isMyHotel: false,
      isMonitored: hotel.isMonitored,
      url: hotel.url,
      source: "booking.com",
      tags: undefined,
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

/**
 * DELETE - Supprimer un concurrent (table scraper "hotels", isClient = false).
 */
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

    const existing = await prisma.scraperHotel.findFirst({
      where: { id, isClient: false },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Concurrent introuvable" },
        { status: 404 }
      );
    }

    await prisma.scraperHotel.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Concurrent supprimé avec succès" });
  } catch (error: unknown) {
    const prismaError = error as { code?: string };
    if (prismaError?.code === "P2025") {
      return NextResponse.json(
        { error: "Concurrent introuvable ou déjà supprimé" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
