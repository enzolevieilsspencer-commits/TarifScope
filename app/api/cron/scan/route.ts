import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/cron/scan
 * Le scan des prix est géré par le backend Python (cron/scheduler côté Python).
 * Ce endpoint ne lance plus de scraping ; il renvoie skipped pour éviter des erreurs Vercel.
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    skipped: true,
    reason: "scraping_moved_to_python",
    message: "Les scans sont exécutés par le backend Python. Configurez un cron/scheduler dans le projet Python.",
  });
}
