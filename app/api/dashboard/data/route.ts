import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/dashboard/data
 * Lit les tables scraper (hotels, rate_snapshots) alimentées par le backend Railway.
 * Même format de réponse que avant pour compatibilité avec le front.
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
        kpis: {
          totalCompetitors: 0,
          activeAlerts: 0,
          avgCompetitorPrice: 0,
          minCompetitorPrice: 0,
          priceGap: 0,
        },
        chartData: [],
        hotelsTable: [],
        competitors: [],
      });
    }

    const clientHotel = scraperHotels.find((h) => h.isClient);
    const competitorHotels = scraperHotels.filter((h) => !h.isClient);

    // Pour chaque hôtel : dernier prix par date de séjour (dateCheckin)
    const since = new Date();
    since.setDate(since.getDate() - 90);

    const dateKeysSet = new Set<string>();
    const pricesByHotelByDate: Record<string, Record<string, { price: number; scrapedAt: Date }>> = {};

    for (const hotel of scraperHotels) {
      pricesByHotelByDate[hotel.id] = {};
      for (const s of hotel.rateSnapshots) {
        if (s.scrapedAt < since) continue;
        const dateKey = s.dateCheckin instanceof Date
          ? s.dateCheckin.toISOString().split("T")[0]
          : String(s.dateCheckin).slice(0, 10);
        dateKeysSet.add(dateKey);
        const price = s.price ?? 0;
        if (price > 0 && (!pricesByHotelByDate[hotel.id][dateKey] || s.scrapedAt > pricesByHotelByDate[hotel.id][dateKey].scrapedAt)) {
          pricesByHotelByDate[hotel.id][dateKey] = { price, scrapedAt: s.scrapedAt };
        }
      }
    }

    const datesToCheck = Array.from(dateKeysSet).sort();

    if (datesToCheck.length === 0) {
      const now = new Date();
      const utcY = now.getUTCFullYear(), utcM = now.getUTCMonth(), utcD = now.getUTCDate();
      for (let i = 0; i < 31; i++) {
        datesToCheck.push(new Date(Date.UTC(utcY, utcM, utcD + i)).toISOString().split("T")[0]);
      }
      datesToCheck.sort();
    }

    const competitorData = scraperHotels.map((hotel) => {
      const pricesByDate = pricesByHotelByDate[hotel.id] || {};
      const prices = Object.values(pricesByDate).map((p) => p.price).filter((p) => p > 0);
      const avgPrice = prices.length > 0 ? prices.reduce((sum, p) => sum + p, 0) / prices.length : 0;
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const lastSnapshot = hotel.rateSnapshots[0] ?? null;

      return {
        id: hotel.id,
        name: hotel.name,
        location: hotel.location ?? "",
        stars: hotel.stars ?? 0,
        url: hotel.url,
        avgPrice,
        minPrice,
        pricesByDate,
        lastUpdate: lastSnapshot?.scrapedAt ?? null,
        isMyHotel: hotel.isClient,
      };
    });

    const myHotelData = competitorData.find((c) => c.isMyHotel);
    const competitorsOnly = competitorData.filter((c) => !c.isMyHotel);

    const allCompetitorPrices = competitorsOnly
      .map((c) => c.avgPrice)
      .filter((p) => p > 0);
    const avgCompetitorPrice = allCompetitorPrices.length > 0
      ? allCompetitorPrices.reduce((sum, p) => sum + p, 0) / allCompetitorPrices.length
      : 0;
    const minCompetitorPrice = allCompetitorPrices.length > 0
      ? Math.min(...allCompetitorPrices)
      : 0;
    const myHotelAvgPrice = myHotelData?.avgPrice ?? 0;
    const priceGap = myHotelAvgPrice > 0 && avgCompetitorPrice > 0
      ? Math.round(myHotelAvgPrice - avgCompetitorPrice)
      : 0;

    const chartData = datesToCheck.map((dateKey) => {
      const myHotelPrice = myHotelData?.pricesByDate[dateKey]?.price;
      const competitorPricesForDate = competitorsOnly
        .map((c) => c.pricesByDate[dateKey]?.price)
        .filter((p): p is number => typeof p === "number" && p > 0);
      const avgPriceForDate = competitorPricesForDate.length > 0
        ? competitorPricesForDate.reduce((sum, p) => sum + p, 0) / competitorPricesForDate.length
        : null;

      const dateLabel = new Date(dateKey + "T12:00:00Z").toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      });

      return {
        date: dateLabel,
        dateISO: dateKey,
        moyenneConcurrents: avgPriceForDate != null ? Math.round(avgPriceForDate) : null,
        monHotel: myHotelPrice != null && myHotelPrice > 0 ? Math.round(myHotelPrice) : null,
      };
    });

    const chartDataFiltered = chartData
      .filter((row) => row.monHotel != null || row.moyenneConcurrents != null)
      .slice(-60);

    const hotelsTable = competitorData.map((comp) => {
      const allPrices = Object.values(comp.pricesByDate).map((p) => p.price).filter((p) => p > 0);
      const minOTA = allPrices.length > 0 ? Math.min(...allPrices) : 0;
      const firstDateKey = Object.keys(comp.pricesByDate).sort()[0];
      const bookingPrice = firstDateKey ? comp.pricesByDate[firstDateKey]?.price ?? 0 : 0;

      const delta = avgCompetitorPrice > 0
        ? Math.round(comp.avgPrice - avgCompetitorPrice)
        : 0;

      let lastUpdateText = "Jamais";
      if (comp.lastUpdate) {
        const diffMs = Date.now() - comp.lastUpdate.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours < 1) lastUpdateText = "Il y a moins d'1h";
        else if (diffHours < 24) lastUpdateText = `Il y a ${diffHours}h`;
        else lastUpdateText = `Il y a ${Math.floor(diffHours / 24)}j`;
      }

      return {
        id: comp.id,
        name: comp.name,
        stars: comp.stars,
        minOTA,
        booking: bookingPrice,
        expedia: 0,
        setConcurrent: Math.round(comp.avgPrice),
        delta,
        lastUpdate: lastUpdateText,
        isPositive: delta >= 0,
        isMyHotel: comp.isMyHotel,
      };
    });

    return NextResponse.json({
      kpis: {
        totalCompetitors: scraperHotels.length,
        activeAlerts: scraperHotels.length,
        avgCompetitorPrice: Math.round(avgCompetitorPrice),
        minCompetitorPrice: Math.round(minCompetitorPrice),
        priceGap: Math.round(priceGap),
      },
      chartData: chartDataFiltered,
      hotelsTable,
      competitors: competitorData,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des données du dashboard:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de la récupération des données" },
      { status: 500 }
    );
  }
}
