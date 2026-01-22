import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultHotel } from "@/lib/hotel";

export async function GET(request: NextRequest) {
  try {
    // Récupérer l'hôtel (créé automatiquement si nécessaire)
    const hotel = await getOrCreateDefaultHotel();

    // Récupérer les derniers scans
    const recentScans = await prisma.runLog.findMany({
      where: {
        hotelId: hotel.id,
      },
      orderBy: {
        startedAt: "desc",
      },
      take: 10,
      include: {
        rateSnapshots: {
          take: 1,
        },
      },
    });

    // Compter les scans d'aujourd'hui
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayScans = await prisma.runLog.count({
      where: {
        hotelId: hotel.id,
        startedAt: {
          gte: today,
          lt: tomorrow,
        },
        status: {
          in: ["success", "partial"],
        },
      },
    });

    return NextResponse.json({
      hotel: {
        id: hotel.id,
        name: hotel.name,
      },
      todayScans,
      maxScansPerDay: 2,
      recentScans: recentScans.map((scan: { id: string; status: string; startedAt: Date; completedAt: Date | null; duration: number | null; error: string | null; rateSnapshots: unknown[] }) => ({
        id: scan.id,
        status: scan.status,
        startedAt: scan.startedAt,
        completedAt: scan.completedAt,
        duration: scan.duration,
        error: scan.error,
        snapshotCount: scan.rateSnapshots.length,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de la récupération du statut" },
      { status: 500 }
    );
  }
}
