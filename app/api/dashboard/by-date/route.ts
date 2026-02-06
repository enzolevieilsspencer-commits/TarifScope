import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/dashboard/by-date?date=YYYY-MM-DD
 * Retourne les prix par hôtel (scraper) pour la date de séjour donnée.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    if (!dateParam) {
      return NextResponse.json(
        { error: "Paramètre date requis (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const date = new Date(dateParam + "T00:00:00.000Z");
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json(
        { error: "Date invalide" },
        { status: 400 }
      );
    }

    const snapshots = await prisma.scraperRateSnapshot.findMany({
      where: {
        dateCheckin: {
          gte: date,
          lt: new Date(date.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { scrapedAt: "desc" },
      include: { hotel: true },
    });

    const byHotel = new Map<string, { name: string; price: number; isMyHotel: boolean }>();
    for (const s of snapshots) {
      if (!byHotel.has(s.hotelId)) {
        byHotel.set(s.hotelId, {
          name: s.hotel.name,
          price: s.price ?? 0,
          isMyHotel: s.hotel.isClient,
        });
      }
    }

    const competitors = Array.from(byHotel.values());

    return NextResponse.json({
      date: dateParam,
      dateLabel: date.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
      competitors,
    });
  } catch (error) {
    console.error("Erreur /api/dashboard/by-date:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur" },
      { status: 500 }
    );
  }
}
