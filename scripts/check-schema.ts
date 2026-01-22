import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkSchema() {
  try {
    // Vérifier si la colonne photoUrl existe
    const result = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Competitor' 
      AND column_name = 'photoUrl'
    `;
    
    if (result.length > 0) {
      console.log("✅ La colonne photoUrl existe déjà dans la table Competitor");
    } else {
      console.log("❌ La colonne photoUrl n'existe pas");
      console.log("💡 Tu peux l'ajouter manuellement dans Supabase SQL Editor:");
      console.log('   ALTER TABLE "Competitor" ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;');
    }
    
    // Vérifier la structure de la table Competitor
    const columns = await prisma.$queryRaw<Array<{ column_name: string; data_type: string }>>`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Competitor'
      ORDER BY ordinal_position
    `;
    
    console.log("\n📋 Colonnes de la table Competitor:");
    columns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    
  } catch (error: any) {
    console.error("❌ Erreur:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();
