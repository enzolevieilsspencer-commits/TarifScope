import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultHotel } from "@/lib/hotel";

export async function GET(request: NextRequest) {
  try {
    const hotel = await getOrCreateDefaultHotel();

    // Récupérer tous les concurrents
    const competitors = await prisma.competitor.findMany({
      where: {
        hotelId: hotel.id,
        isMonitored: true,
      },
    });

    // Récupérer tous les snapshots des 90 derniers jours
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const snapshots = await prisma.rateSnapshot.findMany({
      where: {
        hotelId: hotel.id,
        createdAt: {
          gte: ninetyDaysAgo,
        },
      },
      include: {
        competitor: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Organiser les données par date et par concurrent (utiliser l'ID pour la cohérence)
    const dataByDate: Record<string, Record<string, number>> = {};
    
    snapshots.forEach((snapshot: { createdAt: Date; competitorId: string; price: number }) => {
      const dateKey = snapshot.createdAt.toISOString().split("T")[0];
      if (!dataByDate[dateKey]) {
        dataByDate[dateKey] = {};
      }
      // Utiliser l'ID du concurrent comme clé pour garder la cohérence
      dataByDate[dateKey][snapshot.competitorId] = snapshot.price;
    });

    // Convertir en format pour le graphique
    const chartData = Object.entries(dataByDate)
      .map(([date, prices]) => {
        const dateObj = new Date(date);
        return {
          date: dateObj.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
          dateISO: date,
          ...prices,
        };
      })
      .sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime());

    // Calculer les stats par concurrent
    const hotelStats = await Promise.all(
      competitors.map(async (competitor, competitorIndex: number) => {
        const competitorSnapshots = snapshots.filter(
          (s: { competitorId: string }) => s.competitorId === competitor.id
        );

        if (competitorSnapshots.length === 0) {
          return null;
        }

        const prices = competitorSnapshots.map((s: { price: number }) => s.price).filter((p: number) => p > 0);
        const avgRate = prices.length > 0
          ? Math.round(prices.reduce((sum: number, p: number) => sum + p, 0) / prices.length)
          : 0;
        const min = prices.length > 0 ? Math.min(...prices) : 0;
        const max = prices.length > 0 ? Math.max(...prices) : 0;

        // Calculer la tendance (variation entre le premier et le dernier prix)
        const firstPrice = prices[0];
        const lastPrice = prices[prices.length - 1];
        const trend = firstPrice > 0
          ? Math.round(((lastPrice - firstPrice) / firstPrice) * 100 * 10) / 10
          : 0;

        // Assigner une couleur basée sur l'index
        const colors = ["blue", "green", "orange", "red", "purple"];
        const color = colors[competitorIndex % colors.length];

        return {
          id: competitor.id,
          name: competitor.name,
          avgRate,
          min,
          max,
          trend,
          color,
          isMyHotel: false,
        };
      })
    );

    // Créer un mapping des concurrents avec leurs couleurs assignées de manière cohérente
    const competitorMapping = competitors.map((competitor: { id: string; name: string }, index: number) => {
      const colors = [
        { name: "blue", hex: "#3b82f6" },
        { name: "green", hex: "#22c55e" },
        { name: "orange", hex: "#f97316" },
        { name: "red", hex: "#ef4444" },
        { name: "purple", hex: "#a855f7" },
      ];
      const color = colors[index % colors.length];
      
      return {
        id: competitor.id,
        name: competitor.name,
        color: color.hex,
        colorName: color.name,
      };
    });

    return NextResponse.json({
      chartData,
      hotelStats: hotelStats.filter((s: unknown) => s !== null),
      competitorMapping,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de la récupération" },
      { status: 500 }
    );
  }
}
