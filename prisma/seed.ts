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

  console.log('✅ Seeded categories');

  // Optional: Seed sample notes for testing
  const techCategory = await prisma.category.findUnique({
    where: { name: 'Technology' },
  });

  if (techCategory) {
    // Create a test user
    const testUser = await prisma.user.upsert({
      where: { wallet: '0x0000000000000000000000000000000000000000' },
      update: {},
      create: {
        wallet: '0x0000000000000000000000000000000000000000',
        username: 'Test User',
      },
    });

    // Create a sample question
    const question = await prisma.note.create({
      data: {
        type: 'QUESTION',
        categoryId: techCategory.id,
        userId: testUser.id,
        text: 'What is the best way to learn Web3 development?',
      },
    });

    // Create a sample answer
    await prisma.note.create({
      data: {
        type: 'ANSWER',
        parentId: question.id,
        categoryId: techCategory.id,
        userId: testUser.id,
        text: 'Start with Solidity tutorials and build small projects. Practice is key!',
      },
    });

    console.log('✅ Seeded sample notes (1 question, 1 answer)');
  }

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
