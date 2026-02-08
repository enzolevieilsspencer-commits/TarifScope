import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "error", "warn"],
});

async function testConnection() {
  try {
    console.log("🔍 Test de connexion à la base de données...");
    console.log("DATABASE_URL:", process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":****@"));
    
    // Test simple : compter les tables
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ Connexion réussie !", result);
    
    // Test avec une requête simple
    const hotels = await prisma.scraperHotel.findMany({ take: 1 });
    console.log("✅ Requête test réussie ! Nombre d'hôtels (hotels):", hotels.length);
    
  } catch (error: any) {
    console.error("❌ Erreur de connexion:");
    console.error("Code:", error.code);
    console.error("Message:", error.message);
    console.error("Métadonnées:", error.meta);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
