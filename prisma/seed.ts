import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Categories are now a fixed list in the backend (src/lib/categories.ts).
  // No DB seeding required for categories.

  console.log(
    "✨ Seeding completed! (Categories are managed in-code, not in DB)"
  );
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
