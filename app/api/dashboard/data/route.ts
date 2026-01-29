import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultHotel } from "@/lib/hotel";

export async function GET(request: NextRequest) {
  try {
    // Récupérer l'hôtel principal (créé automatiquement si nécessaire)
    const hotel = await getOrCreateDefaultHotel();

    // Récupérer les concurrents surveillés (y compris l'hôtel de l'utilisateur s'il a une URL)
    const competitors = await prisma.competitor.findMany({
      where: {
        hotelId: hotel.id,
        isMonitored: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Identifier l'hôtel de l'utilisateur (competitor avec tag "mon-hôtel" ou même URL que l'hôtel)
    const myHotelCompetitor = competitors.find(
      (c) => c.tags === "mon-hôtel" || (hotel.url && c.url === hotel.url)
    );

    // Récupérer les derniers snapshots de prix (pour chaque concurrent, le plus récent pour chaque date)
    const datesToCheck = [7, 14, 30].map((days) => {
      const date = new Date();
      date.setDate(date.getDate() + days);
      date.setHours(0, 0, 0, 0);
      return date;
    });

    const rateSnapshots = await prisma.rateSnapshot.findMany({
      where: {
        hotelId: hotel.id,
        date: {
          in: datesToCheck,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        competitor: true,
      },
    });

    // Organiser les données par concurrent et par date
    const competitorData = competitors.map((competitor: { id: string; name: string; location: string; stars: number | null; url: string | null; source: string; tags: string | null }) => {
      const snapshots = rateSnapshots.filter((s: { competitorId: string }) => s.competitorId === competitor.id);
      
      // Pour chaque date, prendre le snapshot le plus récent
      const pricesByDate: Record<string, { price: number; currency: string; available: boolean; date: Date }> = {};
      
      snapshots.forEach((snapshot: { date: Date; price: number; currency: string; available: boolean; createdAt: Date }) => {
        const dateKey = snapshot.date.toISOString().split("T")[0];
        if (!pricesByDate[dateKey] || snapshot.createdAt > pricesByDate[dateKey].date) {
          pricesByDate[dateKey] = {
            price: snapshot.price,
            currency: snapshot.currency,
            available: snapshot.available,
            date: snapshot.createdAt,
          };
        }
      });

      // Calculer la moyenne des prix pour ce concurrent
      const prices = Object.values(pricesByDate).map((p) => p.price).filter((p) => p > 0);
      const avgPrice = prices.length > 0 ? prices.reduce((sum, p) => sum + p, 0) / prices.length : 0;
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

      // Identifier si c'est l'hôtel de l'utilisateur
      const isMyHotel = competitor.id === myHotelCompetitor?.id;

      return {
        id: competitor.id,
        name: competitor.name,
        location: competitor.location,
        stars: competitor.stars || 0,
        url: competitor.url,
        source: competitor.source,
        avgPrice,
        minPrice,
        pricesByDate,
        lastUpdate: snapshots.length > 0 ? snapshots[0].createdAt : null,
        isMyHotel,
      };
    });

    // Compter les alertes actives = nombre de concurrents surveillés
    const activeAlerts = competitors.length;

    // Séparer les concurrents de l'hôtel de l'utilisateur
    const myHotelData = competitorData.find((c: { isMyHotel: boolean }) => c.isMyHotel);
    const competitorsOnly = competitorData.filter((c: { isMyHotel: boolean }) => !c.isMyHotel);

    // Calculer les KPIs globaux (uniquement pour les concurrents, pas l'hôtel de l'utilisateur)
    const allCompetitorPrices = competitorsOnly
      .map((c: { avgPrice: number }) => c.avgPrice)
      .filter((p: number) => p > 0);
    
    const avgCompetitorPrice = allCompetitorPrices.length > 0
      ? allCompetitorPrices.reduce((sum: number, p: number) => sum + p, 0) / allCompetitorPrices.length
      : 0;

    const minCompetitorPrice = allCompetitorPrices.length > 0
      ? Math.min(...allCompetitorPrices)
      : 0;

    // Calculer l'écart réel entre mon hôtel et la moyenne des concurrents
    const myHotelAvgPrice = myHotelData?.avgPrice || 0;
    const priceGap = myHotelAvgPrice > 0 && avgCompetitorPrice > 0
      ? Math.round(myHotelAvgPrice - avgCompetitorPrice)
      : 0;

    // Préparer les données pour le graphique (évolution des prix sur les dernières dates)
    const chartData = datesToCheck.map((date) => {
      const dateKey = date.toISOString().split("T")[0];
      
      // Prix de mon hôtel pour cette date
      const myHotelPrice = myHotelData?.pricesByDate[dateKey]?.price || 0;
      
      // Prix moyens des concurrents (sans mon hôtel) pour cette date
      const competitorPricesForDate = competitorsOnly
        .map((c: { pricesByDate: Record<string, { price: number }> }) => c.pricesByDate[dateKey]?.price || 0)
        .filter((p: number) => p > 0);
      
      const avgPriceForDate = competitorPricesForDate.length > 0
        ? competitorPricesForDate.reduce((sum: number, p: number) => sum + p, 0) / competitorPricesForDate.length
        : 0;

      return {
        date: date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
        dateISO: dateKey,
        moyenneConcurrents: Math.round(avgPriceForDate),
        monHotel: Math.round(myHotelPrice),
      };
    });

    // Préparer les données pour le tableau des hôtels
    const hotelsTable = competitorData.map((comp: { pricesByDate: Record<string, { price: number }>; avgPrice: number; id: string; name: string; stars: number | null; lastUpdate: Date | null; isMyHotel: boolean }) => {
      // Trouver le prix minimum parmi toutes les dates
      const allPrices = Object.values(comp.pricesByDate)
        .map((p: { price: number }) => p.price)
        .filter((p: number) => p > 0);
      
      const minOTA = allPrices.length > 0 ? Math.min(...allPrices) : 0;
      const bookingPrice = comp.pricesByDate[Object.keys(comp.pricesByDate)[0]]?.price || 0;
      
      // Calculer le delta :
      // - Si c'est mon hôtel : écart par rapport à la moyenne des concurrents
      // - Si c'est un concurrent : écart par rapport à la moyenne des concurrents (sans mon hôtel)
      const delta = comp.isMyHotel
        ? (avgCompetitorPrice > 0 ? Math.round(comp.avgPrice - avgCompetitorPrice) : 0)
        : (avgCompetitorPrice > 0 ? Math.round(comp.avgPrice - avgCompetitorPrice) : 0);

      // Calculer le temps depuis la dernière mise à jour
      let lastUpdateText = "Jamais";
      if (comp.lastUpdate) {
        const diffMs = Date.now() - comp.lastUpdate.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours < 1) {
          lastUpdateText = "Il y a moins d'1h";
        } else if (diffHours < 24) {
          lastUpdateText = `Il y a ${diffHours}h`;
        } else {
          const diffDays = Math.floor(diffHours / 24);
          lastUpdateText = `Il y a ${diffDays}j`;
        }
      }

      return {
        id: comp.id,
        name: comp.name,
        stars: comp.stars,
        minOTA,
        booking: bookingPrice,
        expedia: 0, // À remplir si on a des données Expedia
        setConcurrent: Math.round(comp.avgPrice),
        delta,
        lastUpdate: lastUpdateText,
        isPositive: delta >= 0,
        isMyHotel: comp.isMyHotel,
      };
    });

    return NextResponse.json({
      kpis: {
        totalCompetitors: competitors.length,
        activeAlerts,
        avgCompetitorPrice: Math.round(avgCompetitorPrice),
        minCompetitorPrice: Math.round(minCompetitorPrice),
        priceGap: Math.round(priceGap),
      },
      chartData,
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
