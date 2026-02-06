import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bookingUrlSchema = z
  .string()
  .min(1, "URL requise")
  .refine(
    (s) =>
      s.startsWith("https://www.booking.com/") ||
      s.startsWith("http://www.booking.com/"),
    "L'URL doit être une page hôtel Booking.com"
  );

const extractInfoSchema = z.object({
  url: bookingUrlSchema,
});

/**
 * POST /api/competitors/extract-info
 * Appelle le scraper Railway pour extraire nom, lieu, étoiles, photo depuis une URL Booking.com.
 * Variable d'env : SCRAPER_API_URL (ex. https://ton-service.up.railway.app)
 * Le scraper doit exposer : POST /extract avec body { "url": "https://..." } → { name, location?, stars?, photoUrl? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = extractInfoSchema.parse(body);

    const baseUrl = process.env.SCRAPER_API_URL?.replace(/\/$/, "");
    if (!baseUrl) {
      return NextResponse.json(
        {
          error: "Extraction non configurée. Définissez SCRAPER_API_URL (URL du scraper Railway).",
          usePythonBackend: true,
        },
        { status: 501 }
      );
    }

    const extractUrl = `${baseUrl}/extract`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(extractUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text();
      console.warn("Scraper extract failed:", res.status, text);
      return NextResponse.json(
        {
          error: "Le scraper n'a pas pu extraire les infos. Vous pouvez ajouter le concurrent quand même (nom par défaut).",
          usePythonBackend: true,
        },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      name?: string;
      location?: string;
      stars?: number;
      photoUrl?: string;
    };

    return NextResponse.json({
      name: data.name ?? "Concurrent Booking",
      location: data.location ?? "",
      source: "booking.com",
      stars: data.stars ?? 4,
      photoUrl: data.photoUrl ?? undefined,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }
    if ((error as Error).name === "AbortError") {
      return NextResponse.json(
        { error: "Délai d'attente dépassé. Ajoutez le concurrent avec les infos par défaut." },
        { status: 504 }
      );
    }
    console.error("Extract info error:", error);
    return NextResponse.json(
      {
        error: "Impossible de joindre le scraper. Vérifiez SCRAPER_API_URL. Vous pouvez ajouter le concurrent quand même.",
        usePythonBackend: true,
      },
      { status: 502 }
    );
  }
}
