import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/scraper/logs
 * Liste les derniers logs du scraper (table scraper_logs).
 * Query: ?limit=20 (défaut 20)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20));

    const logs = await prisma.scraperLog.findMany({
      orderBy: { startedAt: "desc" },
      take: limit,
      include: {
        hotel: { select: { id: true, name: true } },
      },
    });

    const items = logs.map((log) => ({
      id: log.id,
      status: log.status,
      hotelId: log.hotelId,
      hotelName: log.hotel?.name ?? null,
      snapshotsCreated: log.snapshotsCreated,
      error: log.error,
      startedAt: log.startedAt,
      completedAt: log.completedAt,
      durationSeconds: log.completedAt
        ? Math.round((log.completedAt.getTime() - log.startedAt.getTime()) / 1000)
        : null,
    }));

    return NextResponse.json({ logs: items });
  } catch (error) {
    console.error("Erreur /api/scraper/logs:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur" },
      { status: 500 }
    );
  }
}
