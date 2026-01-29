import { z } from "zod";

// Même logique d'environnement que pour scraper_metadonne
const isProduction = process.env.NODE_ENV === "production";
const isVercel = process.env.VERCEL === "1";

let chromium: any;
let pwChromium: any;

if (isVercel || isProduction) {
  // Production/Vercel : utiliser @sparticuz/chromium
  // (doit déjà être installé pour scraper_metadonne)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  chromium = require("@sparticuz/chromium");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  pwChromium = require("playwright-core").chromium;
} else {
  // Développement local : utiliser playwright classique
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  pwChromium = require("playwright").chromium;
  chromium = null;
}

const PriceResultSchema = z.object({
  price: z.number(),
  currency: z.string(),
  available: z.boolean(),
});

export type PriceResult = z.infer<typeof PriceResultSchema>;

function parsePrice(text: string | null | undefined): number | null {
  if (!text) return null;
  // Exemple : "€ 152", "152 €", "152 €", "152"
  const cleaned = text.replace(/\s/g, " ").replace(/[^\d,\.]/g, " ");
  const match = cleaned.match(/(\d+[.,]?\d*)/);
  if (!match) return null;
  const raw = match[1].replace(",", ".");
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function guessCurrency(text: string | null | undefined): string {
  if (!text) return "EUR";
  if (text.includes("€")) return "EUR";
  if (text.includes("$")) return "USD";
  if (text.includes("£")) return "GBP";
  return "EUR";
}

function buildBookingUrlWithDate(baseUrl: string, date: Date): string {
  try {
    const u = new URL(baseUrl);

    // Booking supporte checkin / checkout en AAAA-MM-JJ
    const checkin = date.toISOString().split("T")[0];
    const checkoutDate = new Date(date);
    checkoutDate.setDate(checkoutDate.getDate() + 1);
    const checkout = checkoutDate.toISOString().split("T")[0];

    u.searchParams.set("checkin", checkin);
    u.searchParams.set("checkout", checkout);

    // Quelques paramètres raisonnables par défaut
    if (!u.searchParams.get("group_adults")) u.searchParams.set("group_adults", "2");
    if (!u.searchParams.get("no_rooms")) u.searchParams.set("no_rooms", "1");
    if (!u.searchParams.get("group_children")) u.searchParams.set("group_children", "0");

    return u.toString();
  } catch {
    // Si l'URL n'est pas valide, on renvoie l'URL brute
    return baseUrl;
  }
}

/**
 * Scrape le prix pour un hôtel Booking.com à une date donnée.
 * - `url`: URL de base Booking de l'hôtel (celle que tu stockes en DB)
 * - `date`: la date du séjour (on définit checkout = date + 1 jour)
 */
export async function scrapeBookingPrice(url: string, date: Date): Promise<PriceResult> {
  console.log(`💶 Démarrage du scraping prix pour: ${url} à la date ${date.toISOString().split("T")[0]}`);
  console.log(`🌍 Environnement: ${isVercel ? "Vercel" : isProduction ? "Production" : "Développement local"}`);

  const targetUrl = buildBookingUrlWithDate(url, date);
  console.log(`🔗 URL utilisée pour le prix: ${targetUrl}`);

  let browser: any;
  let context: any;
  let page: any;

  try {
    if (chromium) {
      const executablePath = await chromium.executablePath();
      browser = await pwChromium.launch({
        args: chromium.args,
        executablePath,
        headless: true,
      });
    } else {
      browser = await pwChromium.launch({
        headless: true,
        args: [
          "--disable-blink-features=AutomationControlled",
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
        ],
      });
    }

    context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36",
      locale: "fr-FR",
      timezoneId: "Europe/Paris",
      viewport: { width: 1365, height: 768 },
    });

    // Bloquer images/fonts/media pour la perf
    await context.route("**/*", async (route: any) => {
      const type = route.request().resourceType();
      if (type === "image" || type === "font" || type === "media") return route.abort();
      return route.continue();
    });

    page = await context.newPage();

    console.log(`📄 Navigation vers: ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 35_000 });

    // Attendre un peu que les prix s'affichent
    await page.waitForTimeout(2000);

    // Cookie/consent (best-effort)
    for (const label of ["Accepter", "Tout accepter", "J'accepte", "Accept", "Accept all"]) {
      try {
        const btn = page.getByRole("button", { name: label });
        if (await btn.count()) {
          await btn.first().click({ timeout: 1500 });
          await page.waitForTimeout(500);
          break;
        }
      } catch {
        // ignore
      }
    }

    // Sélecteurs possibles pour le prix principal
    const priceSelectors = [
      "[data-testid='price-and-discounted-price']",
      "[data-testid='price-and-discounted-price'] span",
      ".prco-valign-middle-helper",
      "[class*='prco-inline-block-maker']",
      "[data-testid='availability-cta']",
    ];

    let rawPriceText: string | null = null;

    for (const sel of priceSelectors) {
      try {
        const locator = page.locator(sel).first();
        if (await locator.count()) {
          const text = (await locator.innerText()).trim();
          if (text && /\d/.test(text)) {
            rawPriceText = text;
            console.log(`✅ Prix trouvé avec le sélecteur ${sel}: ${text}`);
            break;
          }
        }
      } catch (e) {
        console.log(`⚠️ Échec sélecteur prix ${sel}`, e);
      }
    }

    const price = parsePrice(rawPriceText);
    const currency = guessCurrency(rawPriceText);

    if (price == null) {
      console.log("⚠️ Aucun prix parsé, on considère que l'hôtel n'est pas disponible pour cette date.");
      return PriceResultSchema.parse({
        price: 0,
        currency,
        available: false,
      });
    }

    const result = PriceResultSchema.parse({
      price,
      currency,
      available: true,
    });

    console.log("✅ Résultat prix:", result);
    return result;
  } catch (error) {
    console.error("❌ Erreur lors du scraping du prix:", error);
    // On renvoie un résultat "non disponible" plutôt que de tout faire échouer
    return PriceResultSchema.parse({
      price: 0,
      currency: "EUR",
      available: false,
    });
  } finally {
    try {
      if (page) await page.close();
      if (context) await context.close();
      if (browser) await browser.close();
    } catch {
      // ignore
    }
  }
}

