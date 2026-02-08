import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientHotel, requireUser } from "@/lib/hotel";
import { z } from "zod";
import { randomUUID } from "crypto";

const updateHotelSchema = z.object({
  name: z.string().min(1).optional(),
  location: z.string().optional(),
  address: z.string().optional(),
  url: z.string().url().optional(),
  stars: z.number().min(1).max(5).optional(),
});

const createHotelSchema = z.object({
  name: z.string().min(1),
  location: z.string().optional(),
  address: z.string().optional(),
  url: z.string().url(),
  stars: z.number().min(1).max(5).optional(),
  photoUrl: z.string().url().optional().or(z.literal("")),
});

// GET - Récupérer l'hôtel client (isClient = true)
export async function GET(request: NextRequest) {
  try {
    await requireUser();
    const hotel = await getClientHotel();
    if (!hotel) {
      return NextResponse.json(
        { error: "Aucun hôtel configuré. Ajoutez votre hôtel pour commencer." },
        { status: 404 }
      );
    }
    return NextResponse.json({
      id: hotel.id,
      name: hotel.name,
      location: hotel.location,
      address: hotel.address,
      url: hotel.url,
      stars: hotel.stars,
      photoUrl: hotel.photoUrl ?? null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Utilisateur non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de la récupération" },
      { status: 500 }
    );
  }
}

// PUT - Créer ou mettre à jour l'hôtel client (table hotels, isClient = true)
export async function PUT(request: NextRequest) {
  try {
    await requireUser();
    const body = await request.json();
    let hotel = await getClientHotel();

    if (!hotel) {
      // Créer l'hôtel client (url obligatoire)
      const validated = createHotelSchema.parse(body);
      const id = randomUUID();
      hotel = await prisma.scraperHotel.create({
        data: {
          id,
          name: validated.name,
          location: validated.location ?? null,
          address: validated.address ?? null,
          url: validated.url,
          stars: validated.stars ?? null,
          photoUrl: validated.photoUrl && validated.photoUrl !== "" ? validated.photoUrl : null,
          isClient: true,
          isMonitored: true,
        },
      });
      return NextResponse.json({
        id: hotel.id,
        name: hotel.name,
        location: hotel.location,
        address: hotel.address,
        url: hotel.url,
        stars: hotel.stars,
        photoUrl: hotel.photoUrl ?? null,
      });
    }

    const validated = updateHotelSchema.parse(body);
    const data: Record<string, unknown> = {};
    if (validated.name !== undefined) data.name = validated.name;
    if (validated.location !== undefined) data.location = validated.location;
    if (validated.address !== undefined) data.address = validated.address;
    if (validated.url !== undefined) data.url = validated.url;
    if (validated.stars !== undefined) data.stars = validated.stars;

    const updatedHotel = await prisma.scraperHotel.update({
      where: { id: hotel.id },
      data,
    });

    return NextResponse.json({
      id: updatedHotel.id,
      name: updatedHotel.name,
      location: updatedHotel.location,
      address: updatedHotel.address,
      url: updatedHotel.url,
      stars: updatedHotel.stars,
      photoUrl: updatedHotel.photoUrl ?? null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Utilisateur non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
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
