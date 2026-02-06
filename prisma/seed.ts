import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default categories
  const categories = [
    { name: 'General' },
    { name: 'Technology' },
    { name: 'Life Advice' },
    { name: 'Learning' },
    { name: 'Random Thoughts' },
  ];

  for (const category of categories) {
    const existing = await prisma.category.findUnique({
      where: { name: category.name },
    });

    if (!existing) {
      await prisma.category.create({
        data: category,
      });
      console.log(`✅ Created category: ${category.name}`);
    } else {
      console.log(`⏭️  Category already exists: ${category.name}`);
    }
  }

  console.log('✨ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
