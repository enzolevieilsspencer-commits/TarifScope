import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { randomUUID } from "crypto";

const bookingUrlSchema = z
  .string()
  .min(1, "URL requise")
  .refine(
    (s) =>
      s.startsWith("https://www.booking.com/") ||
      s.startsWith("http://www.booking.com/"),
    "L'URL doit être une page hôtel Booking.com"
  );

const competitorSchema = z.object({
  name: z.string().min(1),
  location: z.string().optional(),
  address: z.string().optional(),
  url: bookingUrlSchema,
  source: z.string().min(1).optional(),
  stars: z.number().min(0).max(5).optional(),
  photoUrl: z.string().optional(),
  isMonitored: z.boolean().optional(),
  tags: z.string().optional(),
});

const MAX_COMPETITORS = 5;

/**
 * GET - Liste des concurrents depuis la table scraper "hotels" (isClient = false).
 */
export async function GET(request: NextRequest) {
  try {
    const hotels = await prisma.scraperHotel.findMany({
      where: { isClient: false },
      orderBy: { name: "asc" },
      include: {
        rateSnapshots: {
          orderBy: { scrapedAt: "desc" },
          take: 1,
        },
      },
    });

    const list = hotels.map((h: (typeof hotels)[number]) => ({
      id: h.id,
      name: h.name,
      location: h.location ?? "",
      address: h.address ?? "",
      price: h.rateSnapshots[0]?.price ?? 0,
      stars: h.stars ?? 0,
      photoUrl: h.photoUrl ?? undefined,
      isMyHotel: false,
      isMonitored: h.isMonitored,
      url: h.url,
      source: "booking.com",
      tags: undefined,
    }));

    return NextResponse.json(list);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de la récupération" },
      { status: 500 }
    );
  }
}

/**
 * POST - Ajouter un concurrent = une ligne dans la table scraper "hotels" (isClient = false).
 * Le scraper Railway scrapera cet hôtel au prochain run.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = competitorSchema.parse(body);

    const existingByUrl = await prisma.scraperHotel.findUnique({
      where: { url: validated.url },
    });
    if (existingByUrl) {
      return NextResponse.json(
        { error: "Un concurrent avec cette URL existe déjà." },
        { status: 400 }
      );
    }

    const count = await prisma.scraperHotel.count({
      where: { isClient: false },
    });
    if (count >= MAX_COMPETITORS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_COMPETITORS} concurrents. Supprimez-en un pour en ajouter un autre.` },
        { status: 400 }
      );
    }

    const id = randomUUID();
    const hotel = await prisma.scraperHotel.create({
      data: {
        id,
        name: validated.name,
        location: validated.location ?? null,
        address: validated.address ?? null,
        url: validated.url,
        stars: validated.stars ?? null,
        photoUrl:
        validated.photoUrl && validated.photoUrl.trim() !== ""
          ? validated.photoUrl.trim().startsWith("//")
            ? `https:${validated.photoUrl.trim()}`
            : validated.photoUrl.trim()
          : null,
        isClient: false,
        isMonitored: validated.isMonitored ?? true,
      },
    });

    return NextResponse.json({
      id: hotel.id,
      name: hotel.name,
      location: hotel.location ?? "",
      address: hotel.address ?? "",
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
      const firstMessage = error.issues[0]?.message ?? "Données invalides";
      return NextResponse.json(
        { error: firstMessage, details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de la création" },
      { status: 500 }
    );
  }
}
