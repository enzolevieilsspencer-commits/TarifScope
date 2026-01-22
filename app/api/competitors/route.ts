import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultHotel } from "@/lib/hotel";
import { z } from "zod";

const competitorSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  url: z.string().url().optional(),
  source: z.string().min(1),
  stars: z.number().min(1).max(5),
  photoUrl: z.string().url().optional().or(z.literal("")),
  isMonitored: z.boolean(),
  tags: z.string().optional(),
});

// GET - Récupérer tous les concurrents
export async function GET(request: NextRequest) {
  try {
    const hotel = await getOrCreateDefaultHotel();

    const competitors = await prisma.competitor.findMany({
      where: {
        hotelId: hotel.id,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Récupérer les derniers prix pour chaque concurrent
    const competitorsWithPrices = await Promise.all(
      competitors.map(async (competitor: { id: string; name: string; location: string; stars: number | null; photoUrl: string | null; isMonitored: boolean; url: string | null; source: string; tags: string | null }) => {
        const latestSnapshot = await prisma.rateSnapshot.findFirst({
          where: {
            competitorId: competitor.id,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        return {
          id: competitor.id,
          name: competitor.name,
          location: competitor.location,
          price: latestSnapshot?.price || 0,
          stars: competitor.stars || 0,
          photoUrl: competitor.photoUrl || undefined,
          isMyHotel: false,
          isMonitored: competitor.isMonitored,
          url: competitor.url || undefined,
          source: competitor.source,
          tags: competitor.tags || undefined,
        };
      })
    );

    return NextResponse.json(competitorsWithPrices);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de la récupération" },
      { status: 500 }
    );
  }
}

// POST - Créer un concurrent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = competitorSchema.parse(body);

    const hotel = await getOrCreateDefaultHotel();

    const competitor = await prisma.competitor.create({
      data: {
        name: validated.name,
        location: validated.location,
        url: validated.url || "",
        source: validated.source,
        stars: validated.stars,
        photoUrl: validated.photoUrl || null,
        isMonitored: validated.isMonitored,
        tags: validated.tags || null,
        hotelId: hotel.id,
      },
    });

    return NextResponse.json({
      id: competitor.id,
      name: competitor.name,
      location: competitor.location,
      price: 0,
      stars: competitor.stars || 0,
      photoUrl: competitor.photoUrl || undefined,
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
      { error: error instanceof Error ? error.message : "Erreur lors de la création" },
      { status: 500 }
    );
  }
}
