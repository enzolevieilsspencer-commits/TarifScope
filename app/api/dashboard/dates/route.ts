import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/dashboard/dates
 * Retourne les dates (dateCheckin) qui ont des prix dans rate_snapshots + plage J..J+30.
 */
export async function GET(request: NextRequest) {
  try {
    const snapshots = await prisma.scraperRateSnapshot.findMany({
      select: { dateCheckin: true },
      distinct: ["dateCheckin"],
      orderBy: { dateCheckin: "asc" },
    });

    const fromDb = snapshots.map((s) =>
      (s.dateCheckin instanceof Date ? s.dateCheckin : new Date(s.dateCheckin))
        .toISOString()
        .split("T")[0]
    );
    const uniqueFromDb = [...new Set(fromDb)].sort();

    const now = new Date();
    const utcY = now.getUTCFullYear(), utcM = now.getUTCMonth(), utcD = now.getUTCDate();
    const fullRange = Array.from({ length: 31 }, (_, i) =>
      new Date(Date.UTC(utcY, utcM, utcD + i)).toISOString().split("T")[0]
    );
    const dates = [...new Set([...fullRange, ...uniqueFromDb])].sort();

    return NextResponse.json({ dates });
  } catch (error) {
    console.error("Erreur /api/dashboard/dates:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur" },
      { status: 500 }
    );
  }
}
