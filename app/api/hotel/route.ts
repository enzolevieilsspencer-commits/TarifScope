import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultHotel } from "@/lib/hotel";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateHotelSchema = z.object({
  name: z.string().min(1).optional(),
  location: z.string().optional(),
  address: z.string().optional(),
  url: z.string().url().optional(),
  stars: z.number().min(1).max(5).optional(),
});

// GET - Récupérer les infos de l'hôtel de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const hotel = await getOrCreateDefaultHotel();

    const hotelWithPhoto = hotel as typeof hotel & { photoUrl?: string | null };
    return NextResponse.json({
      id: hotel.id,
      name: hotel.name,
      location: hotel.location,
      address: hotel.address,
      url: hotel.url,
      stars: hotel.stars,
      photoUrl: hotelWithPhoto.photoUrl ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de la récupération" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour l'hôtel de l'utilisateur
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = updateHotelSchema.parse(body);

    const hotel = await getOrCreateDefaultHotel();

    const data: Record<string, unknown> = {};
    if (validated.name !== undefined) data.name = validated.name;
    if (validated.location !== undefined) data.location = validated.location;
    if (validated.address !== undefined) data.address = validated.address;
    if (validated.url !== undefined) data.url = validated.url;
    if (validated.stars !== undefined) data.stars = validated.stars;

    const updatedHotel = await prisma.hotel.update({
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
      photoUrl: (updatedHotel as typeof updatedHotel & { photoUrl?: string | null }).photoUrl ?? null,
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
