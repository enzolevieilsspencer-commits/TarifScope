import { prisma } from "./prisma";
import { createClient } from "./supabase/server";

/**
 * Récupère l'hôtel de l'utilisateur connecté ou le crée s'il n'existe pas
 * Nécessite une session utilisateur valide
 */
export async function getOrCreateUserHotel() {
  try {
    const supabase = await createClient();
    
    // Récupérer l'utilisateur connecté
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Utilisateur non authentifié");
    }

    // Récupérer ou créer l'hôtel pour cet utilisateur
    // Note: On utilise l'ID Supabase (uuid) comme userId
    let hotel = await prisma.hotel.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (!hotel) {
      // Créer un hôtel pour cet utilisateur
      hotel = await prisma.hotel.create({
        data: {
          userId: user.id,
          name: "Mon Hôtel",
          location: "Paris, France",
        },
      });

      // Créer aussi la WatchConfig par défaut
      await prisma.watchConfig.create({
        data: {
          hotelId: hotel.id,
          frequency: "daily",
          watchDates: "7,14,30",
          alertThreshold: 10,
        },
      });
    }

    return hotel;
  } catch (error) {
    console.error("Erreur lors de la récupération/création de l'hôtel:", error);
    throw error;
  }
}

/**
 * @deprecated Utilisez getOrCreateUserHotel() à la place
 * Fonction de compatibilité temporaire
 */
export async function getOrCreateDefaultHotel() {
  return getOrCreateUserHotel();
}
