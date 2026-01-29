import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { POST as runScan } from "@/app/api/scans/run/route";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

function getParisNow() {
  const now = new Date();
  const parisString = now.toLocaleString("en-US", { timeZone: "Europe/Paris" });
  return new Date(parisString);
}

export async function GET(request: NextRequest) {
  console.log("⏰ Cron /api/cron/scan déclenché");

  try {
    const parisNow = getParisNow();
    const hour = parisNow.getHours();
    const minute = parisNow.getMinutes();

    // Plage horaire autorisée : 8h00 à 19h30 (heure française)
    const withinTimeWindow =
      (hour > 8 && hour < 19) ||
      (hour === 8 && minute >= 0) ||
      (hour === 19 && minute <= 30);

    if (!withinTimeWindow) {
      console.log("⏸ Scan ignoré: hors plage horaire 8h–19h30 (heure française)");
      return NextResponse.json({
        skipped: true,
        reason: "hors_plage_horaire",
      });
    }

    // Choisir l'hôtel principal (premier créé)
    const hotel = await prisma.hotel.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (!hotel) {
      console.log("❌ Aucun hôtel trouvé, cron ignoré");
      return NextResponse.json({
        skipped: true,
        reason: "aucun_hotel",
      });
    }

    // 1 scan par jour max (plan Hobby Vercel = 1 cron/jour)
    const maxDailyScans = 1;

    // Calculer début/fin de journée en Europe/Paris
    const startOfDayParis = new Date(parisNow);
    startOfDayParis.setHours(0, 0, 0, 0);
    const endOfDayParis = new Date(parisNow);
    endOfDayParis.setHours(23, 59, 59, 999);

    const todayScans = await prisma.runLog.count({
      where: {
        hotelId: hotel.id,
        startedAt: {
          gte: startOfDayParis,
          lt: endOfDayParis,
        },
        status: {
          in: ["success", "partial"],
        },
      },
    });

    if (todayScans >= maxDailyScans) {
      console.log(
        `⏸ Scan ignoré: 1 scan/jour déjà effectué aujourd'hui (${todayScans}/${maxDailyScans})`
      );
      return NextResponse.json({
        skipped: true,
        reason: "quota_journalier_atteint",
      });
    }

    // Toutes les conditions sont OK -> lancer le scan réel
    console.log("✅ Conditions remplies, lancement du scan automatique");

    const cronSecret = process.env.CRON_SECRET ?? "";
    const internalRequest = new NextRequest(new Request("https://internal/api/scans/run", {
      method: "POST",
      headers: {
        "x-cron-secret": cronSecret,
      },
    }));

    const response = await runScan(internalRequest);
    const data = await response.json();

    return NextResponse.json({
      triggered: true,
      runResponse: data,
    });
  } catch (error) {
    console.error("❌ Erreur dans /api/cron/scan:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erreur dans le cron",
      },
      { status: 500 }
    );
  }
}

