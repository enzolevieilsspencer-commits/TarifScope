import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SCRAPE_PRICES_TIMEOUT_MS = 600_000; // 10 min pour 6 hôtels

/**
 * POST /api/scans/run
 * Appelle le backend Python POST /scrape-prices pour lancer le scraping des prix.
 * Les snapshots sont enregistrés dans Supabase (rate_snapshots).
 * Le front lit les données via GET /api/dashboard/data (Prisma → DB).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const baseUrl = process.env.SCRAPER_API_URL?.replace(/\/$/, "");
    if (!baseUrl) {
      return NextResponse.json(
        {
          error: "Scraper non configuré. Définissez SCRAPER_API_URL (URL du backend Railway).",
          usePythonBackend: true,
        },
        { status: 501 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const limit = typeof body.limit === "number" ? body.limit : 6;
    const dates = typeof body.dates === "number" ? body.dates : 30;

    const scrapeUrl = `${baseUrl}/scrape-prices`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SCRAPE_PRICES_TIMEOUT_MS);

    try {
      const res = await fetch(scrapeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit, dates }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json(
          { error: text || `Erreur ${res.status}` },
          { status: res.status }
        );
      }

      const data = (await res.json()) as {
        success?: boolean;
        message?: string;
        stats?: Record<string, unknown>;
        snapshots_count?: number;
      };

      return NextResponse.json({
        success: data.success ?? true,
        message: data.message ?? "Scan terminé",
        stats: data.stats,
        snapshotsCount: data.snapshots_count,
      });
    } catch (err) {
      clearTimeout(timeoutId);
      const isTimeout = (err as Error).name === "AbortError";
      return NextResponse.json(
        {
          error: isTimeout
            ? "Le scan a pris trop de temps (10 min). Il peut continuer en arrière-plan — vérifiez le dashboard dans quelques minutes."
            : (err as Error).message,
        },
        { status: isTimeout ? 504 : 502 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur" },
      { status: 500 }
    );
  }
}
