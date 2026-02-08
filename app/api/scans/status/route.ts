import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientHotel } from "@/lib/hotel";

export async function GET(request: NextRequest) {
  try {
    const hotel = await getClientHotel();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (!hotel) {
      return NextResponse.json({
        hotel: null,
        todayScans: 0,
        maxScansPerDay: 2,
        recentScans: [],
      });
    }

    const whereLog = { hotelId: hotel.id };
    const recentScans = await prisma.scraperLog.findMany({
      where: whereLog,
      orderBy: { startedAt: "desc" },
      take: 10,
    });

    const todayScans = await prisma.scraperLog.count({
      where: {
        ...whereLog,
        startedAt: { gte: today, lt: tomorrow },
        status: "success",
      },
    });

    return NextResponse.json({
      hotel: { id: hotel.id, name: hotel.name },
      todayScans,
      maxScansPerDay: 2,
      recentScans: recentScans.map((log) => ({
        id: log.id,
        status: log.status,
        startedAt: log.startedAt,
        completedAt: log.completedAt,
        duration: log.completedAt
          ? Math.round((log.completedAt.getTime() - log.startedAt.getTime()) / 1000)
          : null,
        error: log.error,
        snapshotCount: log.snapshotsCreated,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de la récupération du statut" },
      { status: 500 }
    );
  }
}
