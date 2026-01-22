import { z } from "zod";

// Détecter l'environnement
const isProduction = process.env.NODE_ENV === "production";
const isVercel = process.env.VERCEL === "1";

// En développement local, utiliser playwright normal
// En production (Vercel), utiliser @sparticuz/chromium
let chromium: any;
let pwChromium: any;

if (isVercel || isProduction) {
  // Production/Vercel : utiliser @sparticuz/chromium
  chromium = require("@sparticuz/chromium");
  pwChromium = require("playwright-core").chromium;
} else {
  // Développement local : utiliser playwright normal
  pwChromium = require("playwright").chromium;
  chromium = null;
}

const OutputSchema = z.object({
  url: z.string().url(),
  name: z.string().nullable(),
  city: z.string().nullable(),
  stars: z.number().nullable(),
  photo: z.string().url().nullable(),
});

type Output = z.infer<typeof OutputSchema>;

function safeJsonParse(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function firstString(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (Array.isArray(v)) {
    for (const it of v) {
      const s = firstString(it);
      if (s) return s;
    }
  }
  return null;
}

function parseStars(v: any): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const m = v.match(/(\d+(\.\d+)?)/);
    return m ? Number(m[1]) : null;
  }
  if (typeof v === "object") return parseStars(v.ratingValue ?? v.value ?? v.rating);
  return null;
}

function pickHotelFromJsonLd(objects: any[]): any | null {
  for (const obj of objects) {
    if (!obj || typeof obj !== "object") continue;
    const t = obj["@type"];
    const types = Array.isArray(t) ? t : [t];
    const norm = types.filter(Boolean).map((x: any) => String(x).toLowerCase());
    if (norm.includes("hotel") || norm.includes("lodgingbusiness")) return obj;
  }
  return null;
}

function extractCityFromAddress(address: string): string | null {
  // Ex: "35 avenue Pasteur, 13210 Saint-Rémy-de-Provence, France"
  const parts = address.split(",").map((x) => x.trim()).filter(Boolean);
  if (parts.length < 2) return address || null;

  const mid = parts[parts.length - 2] ?? "";
  const city = mid.replace(/^\d{4,6}\s+/, "").trim(); // enlève code postal
  return city || null;
}

/**
 * Reformate l'adresse au format : "Rue, Code postal Ville, Pays"
 * Exemple : "124 Avenue de la Vallée des Baux, 13520 Maussane-les-Alpilles, France"
 */
function formatAddress(address: string): string {
  if (!address || !address.trim()) return "";
  
  console.log(`🔧 Formatage de l'adresse: ${address}`);
  
  // Nettoyer l'adresse : enlever les espaces multiples
  let cleaned = address.trim().replace(/\s+/g, " ");
  
  // Diviser en parties
  let parts = cleaned.split(",").map((x) => x.trim()).filter(Boolean);
  
  // Enlever les doublons exacts (même texte)
  const uniqueParts: string[] = [];
  const seen = new Set<string>();
  for (const part of parts) {
    const normalized = part.toLowerCase().trim();
    // Ignorer les parties vides ou déjà vues
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      uniqueParts.push(part);
    }
  }
  parts = uniqueParts;
  
  if (parts.length === 0) return "";
  
  console.log(`📋 Parties uniques: ${parts.join(" | ")}`);
  
  // Extraire les composants
  let street = "";
  let postalCode = "";
  let city = "";
  let country = "France";
  
  // La première partie est généralement la rue
  if (parts.length > 0) {
    street = parts[0];
  }
  
  // Chercher le code postal + ville et le pays
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    
    // Si c'est "France", c'est le pays
    if (part.toLowerCase() === "france") {
      country = "France";
      continue;
    }
    
    // Format "13520 Maussane-les-Alpilles" ou "13210 Saint-Rémy-de-Provence"
    const postalCityMatch = part.match(/^(\d{4,6})\s+(.+)$/);
    if (postalCityMatch && !postalCode) {
      postalCode = postalCityMatch[1];
      city = postalCityMatch[2];
      continue;
    }
    
    // Format "13520" seul
    const postalOnlyMatch = part.match(/^(\d{4,6})$/);
    if (postalOnlyMatch && !postalCode) {
      postalCode = postalOnlyMatch[1];
      // La ville pourrait être dans la partie suivante
      if (i + 1 < parts.length) {
        const nextPart = parts[i + 1];
        // Si ce n'est pas "France", c'est probablement la ville
        if (nextPart.toLowerCase() !== "france" && !city) {
          city = nextPart;
          i++; // Skip la partie suivante
        }
      }
      continue;
    }
    
    // Si on n'a pas encore de ville et que ce n'est pas un code postal, c'est peut-être la ville
    if (!city && !postalOnlyMatch && part.toLowerCase() !== "france") {
      // Vérifier que ce n'est pas une répétition de la rue
      if (part.toLowerCase() !== street.toLowerCase()) {
        city = part;
      }
    }
  }
  
  // Si on n'a pas trouvé la ville, essayer de l'extraire depuis l'adresse originale
  if (!city) {
    const extractedCity = extractCityFromAddress(address);
    if (extractedCity) {
      city = extractedCity;
    }
  }
  
  // Construire l'adresse au format final : "Rue, Code postal Ville, Pays"
  const finalParts: string[] = [];
  
  if (street) finalParts.push(street);
  
  if (postalCode && city) {
    finalParts.push(`${postalCode} ${city}`);
  } else if (postalCode) {
    finalParts.push(postalCode);
  } else if (city) {
    finalParts.push(city);
  }
  
  if (country) finalParts.push(country);
  
  const result = finalParts.join(", ");
  console.log(`✅ Adresse formatée: ${result}`);
  
  return result;
}

export async function scrapeBookingHotel(url: string): Promise<Output> {
  console.log(`🔍 Démarrage du scraping pour: ${url}`);
  console.log(`🌍 Environnement: ${isVercel ? "Vercel" : isProduction ? "Production" : "Développement local"}`);
  
  let browser;
  try {
    if (chromium) {
      // Production/Vercel : utiliser @sparticuz/chromium
      const executablePath = await chromium.executablePath();
      console.log(`🌐 Chemin Chromium (Vercel): ${executablePath}`);

      browser = await pwChromium.launch({
        args: chromium.args,
        executablePath,
        headless: true,
      });
    } else {
      // Développement local : utiliser playwright normal
      console.log(`🌐 Lancement Chromium (développement local)...`);
      browser = await pwChromium.launch({
        headless: true,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
        ],
      });
    }
    console.log("✅ Navigateur lancé avec succès");
  } catch (error) {
    console.error("❌ Erreur lors du lancement du navigateur:", error);
    throw new Error(`Impossible de lancer le navigateur: ${error instanceof Error ? error.message : String(error)}`);
  }

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36",
    locale: "fr-FR",
    timezoneId: "Europe/Paris",
    viewport: { width: 1365, height: 768 },
  });

  // Perf/stabilité: coupe images/fonts/media (garde scripts/xhr/fetch)
  await context.route("**/*", async (route: any) => {
    const type = route.request().resourceType();
    if (type === "image" || type === "font" || type === "media") return route.abort();
    return route.continue();
  });

  const page = await context.newPage();

  try {
    console.log(`📄 Navigation vers: ${url}`);
    await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
    console.log("✅ Page chargée");

    // Attendre un peu que la page soit complètement rendue
    await page.waitForTimeout(2000);

    // Cookie/consent best-effort (sans se battre)
    for (const label of ["Accepter", "Tout accepter", "J'accepte", "Accept", "Accept all"]) {
      try {
        const btn = page.getByRole("button", { name: label });
        if (await btn.count()) {
          await btn.first().click({ timeout: 1500 });
          await page.waitForTimeout(500);
          break;
        }
      } catch {}
    }

    // Attendre que le contenu principal soit chargé
    try {
      await page.waitForSelector("h1, [data-testid='title'], #hp_hotel_name", { timeout: 5000 });
    } catch {
      console.log("⚠️ Sélecteurs principaux non trouvés, continuation...");
    }

    // ---------- 1) JSON-LD (source la + stable quand dispo)
    console.log("🔍 Recherche de JSON-LD...");
    const jsonLdTexts = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();

    console.log(`📦 ${jsonLdTexts.length} script(s) JSON-LD trouvé(s)`);

    const objects: any[] = [];
    for (const t of jsonLdTexts) {
      const parsed = safeJsonParse(t);
      if (!parsed) continue;
      if (Array.isArray(parsed)) objects.push(...parsed);
      else objects.push(parsed);
    }

    const hotel = pickHotelFromJsonLd(objects);
    console.log(hotel ? "✅ Hôtel trouvé dans JSON-LD" : "❌ Aucun hôtel dans JSON-LD");

    let name: string | null = null;
    let address: string | null = null;
    let city: string | null = null;
    let stars: number | null = null;
    let photo: string | null = null;

    if (hotel) {
      name = firstString(hotel.name);
      console.log(`📝 Nom depuis JSON-LD: ${name || "Non trouvé"}`);

      const addr = hotel.address;
      if (addr && typeof addr === "object") {
        // Extraire les composants de l'adresse (ne pas construire l'adresse complète ici)
        const streetAddress = firstString(addr.streetAddress);
        const postalCode = firstString(addr.postalCode);
        const addressLocality = firstString(addr.addressLocality);
        const addressRegion = firstString(addr.addressRegion);
        
        // Stocker les composants séparément
        if (streetAddress) address = streetAddress;
        if (postalCode) {
          // Stocker code postal + ville ensemble si disponible
          if (addressLocality) {
            address = address ? `${address}, ${postalCode} ${addressLocality}` : `${postalCode} ${addressLocality}`;
            city = addressLocality;
          } else {
            address = address ? `${address}, ${postalCode}` : postalCode;
          }
        } else if (addressLocality) {
          city = addressLocality;
        } else if (addressRegion) {
          city = addressRegion;
        }
      } else if (typeof addr === "string") {
        address = addr;
        city = extractCityFromAddress(addr);
      }
      console.log(`📍 Adresse depuis JSON-LD: ${address || "Non trouvée"}`);
      console.log(`📍 Ville depuis JSON-LD: ${city || "Non trouvée"}`);

      stars = parseStars(hotel.starRating);
      console.log(`⭐ Étoiles depuis JSON-LD: ${stars || "Non trouvées"}`);

      photo = firstString(hotel.image ?? hotel.photo);
      console.log(`📸 Photo depuis JSON-LD: ${photo ? "Trouvée" : "Non trouvée"}`);
    }

    // ---------- 2) Fallback DOM (si JSON-LD incomplet)
    if (!name) {
      console.log("🔍 Recherche du nom dans le DOM...");
      const nameSelectors = [
        "h1.pp-header__title",
        "h1",
        "[data-testid='title']",
        "#hp_hotel_name",
        ".hp__hotel-name",
        "[class*='hotel-name']",
        "h2[data-testid='title']",
      ];
      
      for (const sel of nameSelectors) {
        try {
          const el = page.locator(sel).first();
          if (await el.count()) {
            const t = (await el.innerText()).trim();
            if (t && t.length > 0) {
              name = t;
              console.log(`✅ Nom trouvé avec ${sel}: ${name}`);
              break;
            }
          }
        } catch (e) {
          console.log(`⚠️ Sélecteur ${sel} échoué`);
        }
      }
      
      // Fallback: titre de la page
      if (!name) {
        try {
          const title = await page.title();
          if (title && title.length > 0) {
            name = title.split("|")[0].split("-")[0].trim();
            console.log(`✅ Nom depuis title: ${name}`);
          }
        } catch {}
      }
    }

    // Extraire l'adresse complète si pas encore trouvée
    if (!address) {
      console.log("🔍 Recherche de l'adresse dans le DOM...");
      const addressSelectors = [
        "[data-testid='address']",
        ".hp_address_subtitle",
        "#showMap2",
        ".hp_address",
        "[class*='address']",
        "address",
      ];
      
      for (const sel of addressSelectors) {
        try {
          const el = page.locator(sel).first();
          if (await el.count()) {
            const addrText = (await el.innerText()).trim();
            if (addrText) {
              address = addrText;
              console.log(`✅ Adresse trouvée avec ${sel}: ${address}`);
              break;
            }
          }
        } catch (e) {
          console.log(`⚠️ Sélecteur ${sel} échoué`);
        }
      }
    }

    // Extraire la ville si pas encore trouvée
    if (!city) {
      console.log("🔍 Recherche de la ville dans le DOM...");
      
      // Si on a l'adresse, extraire la ville depuis l'adresse
      if (address) {
        city = extractCityFromAddress(address);
        if (city) {
          console.log(`✅ Ville extraite depuis l'adresse: ${city}`);
        }
      }
      
      // Si toujours pas de ville, chercher dans d'autres sélecteurs
      if (!city) {
        const citySelectors = [
          "[class*='location']",
          "[data-testid='location']",
        ];
        
        for (const sel of citySelectors) {
          try {
            const el = page.locator(sel).first();
            if (await el.count()) {
              const cityText = (await el.innerText()).trim();
              if (cityText) {
                city = extractCityFromAddress(cityText) || cityText;
                console.log(`✅ Ville trouvée avec ${sel}: ${city}`);
                break;
              }
            }
          } catch (e) {
            console.log(`⚠️ Sélecteur ${sel} échoué`);
          }
        }
      }
      
      // Fallback: extraire depuis l'URL
      if (!city) {
        try {
          const urlObj = new URL(url);
          const pathParts = urlObj.pathname.split("/").filter(p => p && p.length > 2);
          for (const part of pathParts) {
            if (part !== "hotel" && part !== "fr" && !part.includes(".")) {
              const decoded = decodeURIComponent(part.replace(/-/g, " "));
              if (decoded.length > 2 && decoded.length < 30) {
                city = decoded.split(" ")[0];
                console.log(`✅ Ville depuis URL: ${city}`);
                break;
              }
            }
          }
        } catch {}
      }
    }
    
    // Utiliser uniquement la ville (pas l'adresse complète)
    // Si on a l'adresse mais pas la ville, extraire la ville depuis l'adresse
    if (!city && address) {
      city = extractCityFromAddress(address);
      if (city) {
        console.log(`✅ Ville extraite depuis l'adresse: ${city}`);
      } else {
        // Si extractCityFromAddress ne fonctionne pas, essayer de prendre le dernier élément après la virgule
        const parts = address.split(",").map((x) => x.trim()).filter(Boolean);
        if (parts.length > 0) {
          const lastPart = parts[parts.length - 1];
          // Enlever le code postal si présent
          city = lastPart.replace(/^\d{4,6}\s+/, "").trim();
          // Enlever "France" ou autres pays
          if (city.toLowerCase() === "france" && parts.length > 1) {
            city = parts[parts.length - 2].replace(/^\d{4,6}\s+/, "").trim();
          }
          console.log(`✅ Ville extraite (fallback): ${city}`);
        }
      }
    }

    // S'assurer qu'on retourne uniquement la ville, jamais l'adresse complète
    if (!city && address) {
      // Dernier recours : prendre la dernière partie de l'adresse
      const parts = address.split(",").map((x) => x.trim()).filter(Boolean);
      if (parts.length > 0) {
        city = parts[parts.length - 1].replace(/^\d{4,6}\s+/, "").trim();
        if (city.toLowerCase() === "france" && parts.length > 1) {
          city = parts[parts.length - 2].replace(/^\d{4,6}\s+/, "").trim();
        }
      }
    }

    if (stars == null) {
      console.log("🔍 Recherche des étoiles...");
      // Heuristique aria-label “X étoile(s)” / “X-star”
      try {
        const labels = await page.$$eval("[aria-label]", (els: Element[]) =>
          els.map((e: Element) => e.getAttribute("aria-label") || "").filter(Boolean)
        );
        let best: number | null = null;
        for (const lab of labels) {
          const lower = lab.toLowerCase();
          if (!lower.includes("étoile") && !lower.includes("star")) continue;
          const m = lab.match(/(\d+(\.\d+)?)/);
          if (m) {
            const v = Number(m[1]);
            best = best == null ? v : Math.max(best, v);
          }
        }
        if (best) {
          stars = best;
          console.log(`✅ Étoiles trouvées: ${stars}`);
        }
      } catch {}
      
      // Fallback: chercher dans les classes/data-attributes
      if (stars == null) {
        try {
          const starElements = await page.$$eval("[data-rating], [data-stars], [class*='star']", (els: Element[]) =>
            els.map((e: Element) => {
              const rating = e.getAttribute("data-rating") || e.getAttribute("data-stars");
              if (rating) return Number(rating);
              const classList = Array.from(e.classList);
              for (const cls of classList) {
                const match = cls.match(/star[_-]?(\d)/i);
                if (match) return Number(match[1]);
              }
              return null;
            }).filter((v): v is number => v !== null)
          );
          if (starElements.length > 0) {
            stars = Math.max(...starElements);
            console.log(`✅ Étoiles trouvées via data-attributes: ${stars}`);
          }
        } catch {}
      }
    }

    if (!photo) {
      console.log("🔍 Recherche de la photo...");
      // og:image = souvent le + fiable
      try {
        const og = page.locator("meta[property='og:image']").first();
        if (await og.count()) {
          const c = await og.getAttribute("content");
          if (c && /^https?:\/\//.test(c)) {
            photo = c.trim();
            console.log(`✅ Photo trouvée via og:image`);
          }
        }
      } catch {}

      // fallback image bstatic
      if (!photo) {
        try {
          const img = page.locator("img[src*='bstatic.com']").first();
          if (await img.count()) {
            const src = await img.getAttribute("src");
            if (src && /^https?:\/\//.test(src)) {
              photo = src.trim();
              console.log(`✅ Photo trouvée via bstatic.com`);
            }
          }
        } catch {}
      }
      
      // Fallback: première grande image
      if (!photo) {
        try {
          const imgs = await page.$$eval("img[src^='http']", (els: HTMLImageElement[]) =>
            els
              .map((img) => ({ src: img.src, width: img.naturalWidth, height: img.naturalHeight }))
              .filter((img) => img.width > 200 && img.height > 200)
              .map((img) => img.src)
          );
          if (imgs.length > 0) {
            photo = imgs[0];
            console.log(`✅ Photo trouvée via grande image`);
          }
        } catch {}
      }
    }

    // Construire l'adresse brute d'abord, puis la reformater
    let rawAddress = "";
    
    // Si on a hotel.address (objet structuré), construire l'adresse depuis les composants
    if (hotel && hotel.address && typeof hotel.address === "object") {
      const addr = hotel.address;
      const street = firstString(addr.streetAddress) || "";
      const postalCode = firstString(addr.postalCode) || "";
      const cityName = firstString(addr.addressLocality) || city || "";
      const country = firstString(addr.addressCountry) || "France";
      
      const parts: string[] = [];
      if (street) parts.push(street);
      if (postalCode && cityName) {
        parts.push(`${postalCode} ${cityName}`);
      } else if (postalCode) {
        parts.push(postalCode);
      } else if (cityName) {
        parts.push(cityName);
      }
      if (country) parts.push(country);
      
      rawAddress = parts.join(", ");
      console.log(`📍 Adresse brute depuis JSON-LD: ${rawAddress}`);
    }
    // Sinon, utiliser l'adresse extraite
    else if (address) {
      rawAddress = address;
      console.log(`📍 Adresse brute depuis DOM: ${rawAddress}`);
    }
    // Si on a seulement la ville, construire une adresse minimale
    else if (city) {
      rawAddress = city;
      console.log(`📍 Ville seule: ${rawAddress}`);
    }
    
    // TOUJOURS reformater l'adresse avec formatAddress
    let finalLocation = "";
    if (rawAddress) {
      finalLocation = formatAddress(rawAddress);
      console.log(`✅ Adresse reformatée: ${finalLocation}`);
    }
    
    const result = OutputSchema.parse({
      url,
      name,
      city: finalLocation,
      stars,
      photo: photo && /^https?:\/\//.test(photo) ? photo : null,
    });
    
    console.log("✅ Extraction réussie:", {
      name: result.name || "Non trouvé",
      city: result.city || "Non trouvé",
      stars: result.stars || "Non trouvé",
      photo: result.photo ? "Trouvée" : "Non trouvée",
    });
    
    return result;
  } catch (error) {
    console.error("❌ Erreur lors du scraping:", error);
    throw error;
  } finally {
    console.log("🧹 Nettoyage des ressources...");
    await page.close().catch(() => {});
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
    console.log("✅ Nettoyage terminé");
  }
}
