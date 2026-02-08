import { prisma } from "./prisma";
import { createClient } from "./supabase/server";

/** Type de l'hôtel client (ScraperHotel avec isClient: true) */
export type ClientHotel = Awaited<ReturnType<typeof getClientHotel>>;

/**
 * Récupère l'hôtel "client" (celui dont isClient = true dans la table hotels).
 * Un seul hôtel client par base. Nécessite une session utilisateur pour les APIs qui l'appellent.
 */
export async function getClientHotel() {
  const hotel = await prisma.scraperHotel.findFirst({
    where: { isClient: true },
  });
  return hotel;
}

/**
 * Récupère l'hôtel client ou null. Compatibilité avec l'ancien getOrCreateDefaultHotel.
 * Ne crée plus d'hôtel : l'hôtel client est créé via PUT /api/hotel si besoin.
 */
export async function getOrCreateDefaultHotel(): Promise<ClientHotel> {
  const hotel = await getClientHotel();
  if (!hotel) {
    throw new Error("Aucun hôtel client configuré. Ajoutez votre hôtel dans les paramètres.");
  }
  return hotel;
}

/**
 * Vérifie que l'utilisateur est authentifié. À appeler dans les routes qui utilisent l'hôtel client.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Utilisateur non authentifié");
  }
  return user;
}
