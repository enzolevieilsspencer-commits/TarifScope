import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/history
 * Lit les tables scraper (hotels, rate_snapshots) pour l'historique des tarifs.
 */
export async function GET(request: NextRequest) {
  try {
    const scraperHotels = await prisma.scraperHotel.findMany({
      where: { isMonitored: true },
      orderBy: [{ isClient: "desc" }, { name: "asc" }],
      include: {
        rateSnapshots: {
          orderBy: { scrapedAt: "desc" },
        },
      },
    });

    if (scraperHotels.length === 0) {
      return NextResponse.json({
        chartData: [],
        hotelStats: [],
        competitorMapping: [],
      });
    }

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const todayISO = new Date().toISOString().split("T")[0];

    const byStayDateAndHotel: Record<string, Record<string, number>> = {};
    for (const hotel of scraperHotels) {
      for (const s of hotel.rateSnapshots) {
        if (s.scrapedAt < ninetyDaysAgo) continue;
        const dateKey = s.dateCheckin instanceof Date
          ? s.dateCheckin.toISOString().split("T")[0]
          : String(s.dateCheckin).slice(0, 10);
        if (dateKey > todayISO) continue;
        const price = s.price ?? 0;
        if (price <= 0) continue;
        if (!byStayDateAndHotel[dateKey]) byStayDateAndHotel[dateKey] = {};
        if (byStayDateAndHotel[dateKey][hotel.id] == null) {
          byStayDateAndHotel[dateKey][hotel.id] = Math.round(price * 10) / 10;
        }
      }
    }

    const sortedDates = Object.keys(byStayDateAndHotel).sort();
    const chartData = sortedDates.map((dateKey) => {
      const dateObj = new Date(dateKey + "T12:00:00Z");
      const row: Record<string, string | number | null> = {
        date: dateObj.toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" }),
        dateISO: dateKey,
      };
      scraperHotels.forEach((h) => {
        const price = byStayDateAndHotel[dateKey][h.id];
        row[h.id] = price != null && price > 0 ? price : null;
      });
      return row;
    });

    const colors = [
      { name: "blue", hex: "#3b82f6" },
      { name: "green", hex: "#22c55e" },
      { name: "orange", hex: "#f97316" },
      { name: "red", hex: "#ef4444" },
      { name: "purple", hex: "#a855f7" },
    ];

    const competitorMapping = scraperHotels.map((hotel, index) => {
      const isMyHotel = hotel.isClient;
      const color = isMyHotel ? colors[0] : colors[(index % (colors.length - 1)) + 1];
      return {
        id: hotel.id,
        name: hotel.name,
        color: color.hex,
        colorName: color.name,
        isMyHotel,
      };
    });

    const hotelStats = await Promise.all(
      scraperHotels.map((hotel, index) => {
        const prices = hotel.rateSnapshots
          .filter((s) => (s.price ?? 0) > 0)
          .map((s) => s.price as number);
        if (prices.length === 0) return null;

        const avgRate = Math.round(
          prices.reduce((sum, p) => sum + p, 0) / prices.length
        );
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const firstPrice = prices[prices.length - 1];
        const lastPrice = prices[0];
        const trend = firstPrice > 0
          ? Math.round(((lastPrice - firstPrice) / firstPrice) * 100 * 10) / 10
          : 0;

        const color = hotel.isClient ? "blue" : (["green", "orange", "red", "purple"] as const)[index % 4];

        return {
          id: hotel.id,
          name: hotel.name,
          avgRate,
          min,
          max,
          trend,
          color,
          isMyHotel: hotel.isClient,
        };
      })
    );

    return NextResponse.json({
      chartData,
      hotelStats: hotelStats.filter((s): s is NonNullable<typeof s> => s !== null),
      competitorMapping,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de la récupération" },
      { status: 500 }
    );
  }
}
