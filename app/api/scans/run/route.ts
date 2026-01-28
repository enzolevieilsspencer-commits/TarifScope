import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultHotel } from "@/lib/hotel";
import { createClient } from "@/lib/supabase/server";

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
    // Authentification
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Récupérer l'hôtel de l'utilisateur
    const hotel = await getOrCreateDefaultHotel();

    // Récupérer les concurrents surveillés
    const competitors = await prisma.competitor.findMany({
      where: {
        hotelId: hotel.id,
        isMonitored: true,
      },
    });

    if (competitors.length === 0) {
      return NextResponse.json(
        { error: "Aucun concurrent à surveiller" },
        { status: 400 }
      );
    }

    console.log(`🏨 ${competitors.length} concurrents à scanner`);

    // Créer un RunLog pour tracer le scan
    const runLog = await prisma.runLog.create({
      data: {
        hotelId: hotel.id,
        status: "running",
      },
    });

    // Pour l'instant, on simule le scan (le vrai scraper sera intégré plus tard)
    // TODO: Intégrer le scraper de prix réel ici
    let snapshotsCreated = 0;
    const errors: string[] = [];

    // Simuler la création de snapshots pour chaque concurrent
    // Dans la vraie implémentation, on appellerait le scraper ici
    for (const competitor of competitors) {
      try {
        // Dates à scanner (J+7, J+14, J+30)
        const dates = [7, 14, 30].map((days) => {
          const date = new Date();
          date.setDate(date.getDate() + days);
          date.setHours(0, 0, 0, 0);
          return date;
        });

        // Pour chaque date, créer un snapshot (simulé pour l'instant)
        for (const date of dates) {
          // TODO: Remplacer par un vrai appel au scraper
          // const price = await scraper.scrapePrice(competitor.url, date, ...);
          
          // Pour l'instant, on crée un snapshot avec un prix aléatoire (simulation)
          const mockPrice = Math.floor(Math.random() * 100) + 100; // 100-200€
          
          await prisma.rateSnapshot.create({
            data: {
              hotelId: hotel.id,
              competitorId: competitor.id,
              runLogId: runLog.id,
              date,
              price: mockPrice,
              currency: "EUR",
              available: true,
            },
          });
          snapshotsCreated++;
        }
      } catch (error) {
        console.error(`❌ Erreur pour ${competitor.name}:`, error);
        errors.push(`Erreur pour ${competitor.name}`);
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
      competitorsScanned: competitors.length,
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
