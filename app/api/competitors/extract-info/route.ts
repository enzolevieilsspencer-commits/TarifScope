import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { scrapeBookingHotel } from "@/lib/scraper/scraper_metadonne";

const extractInfoSchema = z.object({
  url: z.string().url("L'URL n'est pas valide"),
});

export async function POST(request: NextRequest) {
  console.log("📥 Requête POST reçue sur /api/competitors/extract-info");
  
  try {
    const body = await request.json();
    console.log("📄 Body reçu:", { url: body.url?.substring(0, 50) });
    
    const { url } = extractInfoSchema.parse(body);
    console.log("✅ URL validée:", url.substring(0, 100));

    // Vérifier que c'est une URL Booking.com
    if (!url.includes("booking.com")) {
      console.error("❌ URL n'est pas Booking.com");
      return NextResponse.json(
        { error: "Seules les URLs Booking.com sont supportées pour le moment" },
        { status: 400 }
      );
    }

    console.log("🚀 Démarrage de l'extraction...");
    // Utiliser le scraper
    const data = await scrapeBookingHotel(url);
    console.log("✅ Extraction terminée avec succès");

    // Adapter le format de réponse au format attendu par le frontend
    return NextResponse.json({
      name: data.name || "",
      location: data.city || "",
      stars: data.stars || 4,
      photoUrl: data.photo || "",
      source: "booking.com",
      url: url,
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'extraction des infos:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error 
      ? error.message 
      : "Erreur lors de l'extraction des informations";

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
