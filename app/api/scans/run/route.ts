import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/scans/run
 * Le scraping des prix est géré par le backend Python.
 * Ce endpoint renvoie une indication pour le front : lancer le scan côté Python.
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

    return NextResponse.json({
      message: "Le scan des prix est géré par le backend Python. Exécutez le scraper Python ; les données apparaîtront dans le dashboard après le prochain run.",
      runBy: "python_backend",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur" },
      { status: 500 }
    );
  }
}
