import { prisma } from "../lib/prisma";
import { randomUUID } from "crypto";

async function main() {
  const clientHotel = await prisma.scraperHotel.findFirst({
    where: { isClient: true },
  });

  if (!clientHotel) {
    const id = randomUUID();
    await prisma.scraperHotel.create({
      data: {
        id,
        name: "Mon Hôtel",
        location: "Paris, France",
        url: `https://www.booking.com/hotel/fr/seed-client-${id.slice(0, 8)}`,
        isClient: true,
        isMonitored: true,
      },
    });
    console.log("✅ Hôtel client créé: Mon Hôtel");
  } else {
    console.log("✅ Hôtel client existant:", clientHotel.name);
  }

  const competitorCount = await prisma.scraperHotel.count({
    where: { isClient: false },
  });
  if (competitorCount > 0) {
    console.log(`✅ ${competitorCount} concurrent(s) existant(s)`);
    return;
  }

  const baseId = randomUUID().slice(0, 8);
  const competitors = [
    { name: "Hôtel Concurrent 1", location: "Paris, France", url: `https://www.booking.com/hotel/fr/seed-c1-${baseId}`, stars: 4 },
    { name: "Hôtel Concurrent 2", location: "Paris, France", url: `https://www.booking.com/hotel/fr/seed-c2-${baseId}`, stars: 5 },
  ];
  for (const c of competitors) {
    await prisma.scraperHotel.create({
      data: {
        id: randomUUID(),
        name: c.name,
        location: c.location,
        url: c.url,
        stars: c.stars,
        isClient: false,
        isMonitored: true,
      },
    });
    console.log("✅ Concurrent créé:", c.name);
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
