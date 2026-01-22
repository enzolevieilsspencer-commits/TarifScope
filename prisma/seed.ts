import { prisma } from "../lib/prisma";

async function main() {
  // Vérifier si un hôtel existe déjà
  let hotel = await prisma.hotel.findFirst();
  
  if (!hotel) {
    // Créer un hôtel par défaut
    hotel = await prisma.hotel.create({
      data: {
        name: "Mon Hôtel",
        location: "Paris, France",
        url: "https://www.booking.com/hotel/example",
      },
    });
    console.log("✅ Hôtel créé:", hotel.name);
  } else {
    console.log("✅ Hôtel existant trouvé:", hotel.name);
  }

  // Vérifier si des concurrents existent déjà
  const existingCompetitors = await prisma.competitor.findMany({
    where: { hotelId: hotel.id },
  });

  if (existingCompetitors.length > 0) {
    console.log(`✅ ${existingCompetitors.length} concurrent(s) existant(s) trouvé(s)`);
    return;
  }

  // Créer quelques concurrents d'exemple
  const competitors = [
    {
      name: "Hôtel Concurrent 1",
      location: "Paris, France",
      url: "https://www.booking.com/hotel/concurrent1",
      stars: 4,
    },
    {
      name: "Hôtel Concurrent 2",
      location: "Paris, France",
      url: "https://www.booking.com/hotel/concurrent2",
      stars: 5,
    },
  ];

  for (const competitor of competitors) {
    const created = await prisma.competitor.create({
      data: {
        ...competitor,
        hotelId: hotel.id,
        isMonitored: true,
        source: "booking.com",
      },
    });
    console.log("✅ Concurrent créé:", created.name);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
