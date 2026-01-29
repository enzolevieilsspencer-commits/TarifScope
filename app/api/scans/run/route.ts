import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultHotel } from "@/lib/hotel";
import { createClient } from "@/lib/supabase/server";
import { scrapeBookingPrice } from "@/lib/scraper/scraper_tarifs";

export const maxDuration = 300; // 5 minutes max
export const dynamic = "force-dynamic";

/**
 * POST /api/scans/run
 * Lance un scan des prix pour tous les concurrents surveillés
 */
export async function POST(request: NextRequest) {
  console.log("🚀 Démarrage d'un scan de prix...");
  const startTime = Date.now();

  try {
    // Mode cron (appel interne avec secret) ou mode utilisateur (via dashboard)
    const cronSecretHeader = request.headers.get("x-cron-secret");
    const isCronCall = !!cronSecretHeader && cronSecretHeader === process.env.CRON_SECRET;

    let hotel;

    if (isCronCall) {
      console.log("🕒 Appel de scan en mode CRON");
      hotel = await prisma.hotel.findFirst({
        orderBy: { createdAt: "asc" },
      });

      if (!hotel) {
        return NextResponse.json(
          { error: "Aucun hôtel configuré pour le cron" },
          { status: 400 }
        );
      }
    } else {
      // Authentification utilisateur classique
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json(
          { error: "Non authentifié" },
          { status: 401 }
        );
      }

      // Récupérer l'hôtel principal lié à l'utilisateur
      hotel = await getOrCreateDefaultHotel();
    }

    // Récupérer la configuration de scan (watchDates: "7,14,30" par défaut)
    const watchConfig = await prisma.watchConfig.findUnique({
      where: { hotelId: hotel.id },
    });

    const dayOffsets =
      watchConfig?.watchDates
        ?.split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => Number.isFinite(n) && n >= 0) || [7, 14, 30];

    console.log("📅 Offsets de jours utilisés pour le scan:", dayOffsets);

    // Récupérer les concurrents surveillés
    const competitors = await prisma.competitor.findMany({
      where: {
        hotelId: hotel.id,
        isMonitored: true,
      },
    });

    // Si l'hôtel a une URL, créer/récupérer un "competitor" pour l'hôtel de l'utilisateur
    let myHotelCompetitor = null;
    if (hotel.url && hotel.url.includes("booking.com")) {
      // Chercher si un competitor existe déjà pour cet hôtel (même URL)
      myHotelCompetitor = await prisma.competitor.findFirst({
        where: {
          hotelId: hotel.id,
          url: hotel.url,
        },
      });

      // Si pas trouvé, créer un competitor pour l'hôtel de l'utilisateur
      if (!myHotelCompetitor) {
        myHotelCompetitor = await prisma.competitor.create({
          data: {
            hotelId: hotel.id,
            name: hotel.name,
            location: hotel.location || "",
            url: hotel.url,
            source: "booking.com",
            stars: hotel.stars,
            photoUrl: (hotel as { photoUrl?: string | null }).photoUrl || null,
            isMonitored: true,
            tags: "mon-hôtel", // Tag spécial pour identifier que c'est l'hôtel de l'utilisateur
          },
        });
        console.log("✅ Competitor créé pour l'hôtel de l'utilisateur");
      } else {
        // Mettre à jour les infos si nécessaire
        await prisma.competitor.update({
          where: { id: myHotelCompetitor.id },
          data: {
            name: hotel.name,
            location: hotel.location || myHotelCompetitor.location,
            stars: hotel.stars || myHotelCompetitor.stars,
            photoUrl: (hotel as { photoUrl?: string | null }).photoUrl || myHotelCompetitor.photoUrl,
            isMonitored: true,
          },
        });
      }
    }

    // Liste finale : concurrents + hôtel de l'utilisateur (si disponible)
    const allCompetitorsToScan = myHotelCompetitor
      ? [...competitors, myHotelCompetitor]
      : competitors;

    if (allCompetitorsToScan.length === 0) {
      return NextResponse.json(
        { error: "Aucun concurrent à surveiller et aucun URL d'hôtel configuré" },
        { status: 400 }
      );
    }

    console.log(`🏨 ${allCompetitorsToScan.length} concurrents à scanner (dont ${myHotelCompetitor ? "l'hôtel de l'utilisateur" : "0 hôtel utilisateur"})`);

    // Créer un RunLog pour tracer le scan
    const runLog = await prisma.runLog.create({
      data: {
        hotelId: hotel.id,
        status: "running",
      },
    });

    let snapshotsCreated = 0;
    const errors: string[] = [];

    // Fonction utilitaire pour traiter un concurrent (toutes les dates)
    const processCompetitor = async (competitor: {
      id: string;
      name: string;
      url: string | null;
    }) => {
      let createdForThisCompetitor = 0;
      const localErrors: string[] = [];

      try {
        if (!competitor.url) {
          console.warn(`⚠️ Concurrent sans URL, ignoré: ${competitor.name}`);
          return { created: 0, errors: [`Concurrent sans URL: ${competitor.name}`] };
        }

        // Dates à scanner selon la config (ex: J+7, J+14, J+30)
        const dates = dayOffsets.map((offset) => {
          const date = new Date();
          date.setDate(date.getDate() + offset);
          date.setHours(0, 0, 0, 0);
          return date;
        });

        for (const date of dates) {
          const { price, currency, available } = await scrapeBookingPrice(competitor.url, date);
          const finalPrice = price > 0 ? price : 0;

          await prisma.rateSnapshot.create({
            data: {
              hotelId: hotel.id,
              competitorId: competitor.id,
              runLogId: runLog.id,
              date,
              price: finalPrice,
              currency,
              available,
            },
          });
          createdForThisCompetitor++;
        }
      } catch (error) {
        console.error(`❌ Erreur pour ${competitor.name}:`, error);
        localErrors.push(`Erreur pour ${competitor.name}`);
      }

      return { created: createdForThisCompetitor, errors: localErrors };
    };

    // Exécuter les concurrents par batch de 5 en parallèle
    const CONCURRENCY = 5;
    for (let i = 0; i < allCompetitorsToScan.length; i += CONCURRENCY) {
      const batch = allCompetitorsToScan.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        batch.map((c) =>
          processCompetitor({
            id: c.id,
            name: c.name,
            url: c.url,
          })
        )
      );

      for (const r of results) {
        snapshotsCreated += r.created;
        errors.push(...r.errors);
      }
    }

    // Calculer la durée
    const duration = Date.now() - startTime;

    // Mettre à jour le RunLog
    const finalStatus = errors.length === 0 ? "success" : 
                       snapshotsCreated > 0 ? "partial" : "failed";

    await prisma.runLog.update({
      where: { id: runLog.id },
      data: {
        status: finalStatus,
        completedAt: new Date(),
        duration,
        snapshotsCreated,
        error: errors.length > 0 ? errors.join("; ") : null,
      },
    });

    console.log(`\n✅ Scan terminé en ${duration}ms - ${snapshotsCreated} snapshots créés`);

    return NextResponse.json({
      success: true,
      runLogId: runLog.id,
      status: finalStatus,
      duration,
      snapshotsCreated,
      competitorsScanned: allCompetitorsToScan.length,
      myHotelScanned: !!myHotelCompetitor,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error("❌ Erreur lors du scan:", error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Erreur lors du scan",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
