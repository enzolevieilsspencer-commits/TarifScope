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
    const maxAttempts = 3;
    const retryDelayMs = 2500;
    const timeoutMs = 90_000; // 90 s par tentative

    console.log("[extract-info] Appel du scraper:", extractUrl);

    let lastError: string | null = null;
    let lastStatus: number | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetch(extractUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
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
        }

        lastStatus = res.status;
        const text = await res.text();
        lastError = text || `HTTP ${res.status}`;
        console.warn(
          `[extract-info] Scraper a répondu avec une erreur (tentative ${attempt}/${maxAttempts}):`,
          res.status,
          text.slice(0, 200)
        );

        const isRetryable = res.status === 502 || res.status === 503 || res.status === 504;
        if (isRetryable && attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, retryDelayMs));
          continue;
        }
        break;
      } catch (err) {
        clearTimeout(timeoutId);
        lastError = (err as Error).message;
        lastStatus = (err as Error).name === "AbortError" ? 504 : 502;
        console.warn(
          `[extract-info] Impossible de joindre le scraper (tentative ${attempt}/${maxAttempts}):`,
          (err as Error).name,
          lastError
        );

        const isRetryable = (err as Error).name === "AbortError" || (err as Error).message?.includes("fetch");
        if (isRetryable && attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, retryDelayMs));
          continue;
        }
        if ((err as Error).name === "AbortError") {
          return NextResponse.json(
            { error: "Le scraper a mis trop de temps à répondre (90 s). Réessayez." },
            { status: 504 }
          );
        }
        break;
      }
    }

    return NextResponse.json(
      {
        error:
          lastError ||
          "Le scraper n'a pas répondu après plusieurs tentatives. Vérifiez que le scraper Railway est en ligne et que SCRAPER_API_URL est correct.",
        usePythonBackend: true,
        hint: "Le 502 vient du scraper Railway (indisponible, erreur côté /extract, ou timeout). Regardez le terminal Next.js et les logs Railway.",
      },
      { status: lastStatus === 504 ? 504 : 502 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Extract info error:", error);
    return NextResponse.json(
      {
        error: "Impossible de joindre le scraper. Vérifiez SCRAPER_API_URL.",
        usePythonBackend: true,
      },
      { status: 502 }
    );
  }
}
