import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const INITIAL_CATEGORIES = [
  "Drinks",
  "Food",
  "Snacks",
  "Personal Care",
  "Household",
  "Medicine",
  "Load",
  "Others",
];

async function main() {
  console.log("Seeding initial categories...");

  for (const name of INITIAL_CATEGORIES) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log("Categories seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
