import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data (for clean demo)
  console.log('🧹 Clearing existing data...');
  await prisma.actionProof.deleteMany();
  await prisma.noteView.deleteMany();
  await prisma.noteLike.deleteMany();
  await prisma.note.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Cleared existing data');

  // Create categories
  const categoryData = [
    { name: 'Dating/Romance' },
    { name: 'Family' },
    { name: 'Self' },
    { name: 'Crypto' },
    { name: 'Business' },
    { name: 'Other' },
  ];

  const categories = [];
  for (const cat of categoryData) {
    const category = await prisma.category.create({ data: cat });
    categories.push(category);
    console.log(`✅ Created category: ${category.name}`);
  }

  // Create demo users
  const users = [];
  const usernames = ['Alex', 'Sam', 'Jordan', 'Casey', 'Taylor'];
  for (let i = 0; i < usernames.length; i++) {
    const user = await prisma.user.create({
      data: {
        wallet: `0x${i.toString().padStart(40, '0')}`,
        username: usernames[i],
      },
    });
    users.push(user);
  }
  console.log(`✅ Created ${users.length} demo users`);

  // Sample questions and answers per category
  const sampleData = [
    {
      category: 'Dating/Romance',
      questions: [
        {
          text: 'How do you know when someone is genuinely interested in you?',
          answers: [
            'They make time for you consistently, not just when convenient.',
            'Pay attention to their actions, not just words. Consistency is key.',
            'They remember small details about your life and ask follow-up questions.',
          ],
        },
        {
          text: 'What are some green flags to look for in early dating?',
          answers: [
            'They communicate openly about their intentions and feelings.',
            'Respect for boundaries and active listening during conversations.',
            'They introduce you to their friends and include you in their life.',
          ],
        },
        {
          text: 'How do you maintain individuality while in a relationship?',
          answers: [
            'Keep your hobbies and friendships alive. Balance is important.',
            'Set aside personal time for self-care and growth.',
          ],
        },
        {
          text: 'When is the right time to have the exclusivity talk?',
          answers: [
            'When you feel ready and have been consistently seeing each other.',
            'Usually after 6-8 dates or when you both feel a strong connection.',
          ],
        },
        {
          text: 'How do you deal with different love languages in a relationship?',
          answers: [
            'Learn your partner\'s love language and make an effort to speak it.',
            'Communicate openly about how you each prefer to give and receive love.',
          ],
        },
      ],
    },
    {
      category: 'Family',
      questions: [
        {
          text: 'How do you set healthy boundaries with family members?',
          answers: [
            'Communicate clearly and consistently about your limits.',
            'It\'s okay to say no. Your mental health matters.',
            'Start small and be firm but respectful in your boundaries.',
          ],
        },
        {
          text: 'What are some ways to stay connected with family across distances?',
          answers: [
            'Schedule regular video calls, even if brief. Consistency matters.',
            'Share photos and updates in a family group chat.',
            'Plan annual reunions or visits to maintain strong bonds.',
          ],
        },
        {
          text: 'How do you handle disagreements during family gatherings?',
          answers: [
            'Choose your battles. Not every disagreement needs to be addressed.',
            'Take a break if things get heated. Return when everyone is calm.',
          ],
        },
        {
          text: 'What are good conversation starters for family dinners?',
          answers: [
            'Ask about recent experiences or upcoming plans.',
            'Share interesting stories or ask for advice on something.',
          ],
        },
        {
          text: 'How do you balance time between your family and your partner\'s family?',
          answers: [
            'Communicate openly with your partner and plan together.',
            'Alternate holidays or create new traditions that include both families.',
          ],
        },
      ],
    },
    {
      category: 'Self',
      questions: [
        {
          text: 'How do you build self-confidence when feeling insecure?',
          answers: [
            'Focus on your strengths and past achievements. Write them down.',
            'Practice self-compassion. Talk to yourself like you would a friend.',
            'Set small, achievable goals and celebrate each win.',
          ],
        },
        {
          text: 'What are effective ways to develop a morning routine?',
          answers: [
            'Start with one small habit and build from there.',
            'Prepare the night before to make mornings easier.',
            'Focus on consistency over perfection. Even 5 minutes counts.',
          ],
        },
        {
          text: 'How do you overcome procrastination?',
          answers: [
            'Break tasks into tiny steps. Just do the first 5 minutes.',
            'Remove distractions and create a dedicated workspace.',
          ],
        },
        {
          text: 'What are signs you need to take a mental health day?',
          answers: [
            'Feeling constantly exhausted despite rest.',
            'Difficulty concentrating or increased irritability.',
          ],
        },
        {
          text: 'How do you find your passion or purpose in life?',
          answers: [
            'Try new things and pay attention to what energizes you.',
            'Reflect on what problems you care about solving.',
          ],
        },
      ],
    },
    {
      category: 'Crypto',
      questions: [
        {
          text: 'What are the best practices for securing your crypto wallet?',
          answers: [
            'Use hardware wallets for large amounts. Never share your seed phrase.',
            'Enable 2FA on all exchanges and use unique passwords.',
            'Keep most funds in cold storage, only keep trading amounts on exchanges.',
          ],
        },
        {
          text: 'How do you research a new crypto project before investing?',
          answers: [
            'Check the team, whitepaper, and tokenomics. Look for red flags.',
            'Review the project\'s GitHub activity and community engagement.',
            'Never invest more than you can afford to lose. DYOR always.',
          ],
        },
        {
          text: 'What is the difference between Layer 1 and Layer 2 solutions?',
          answers: [
            'Layer 1 is the base blockchain (like Ethereum). Layer 2 builds on top for scalability.',
            'L2s process transactions off-chain then settle on L1 for security.',
          ],
        },
        {
          text: 'How do you handle crypto taxes?',
          answers: [
            'Track every transaction. Use tools like CoinTracker or Koinly.',
            'Consult a crypto-savvy accountant. Tax laws vary by country.',
          ],
        },
        {
          text: 'What are the risks of DeFi protocols?',
          answers: [
            'Smart contract bugs, rug pulls, and impermanent loss are major risks.',
            'Only use audited protocols and never invest your entire portfolio.',
          ],
        },
      ],
    },
    {
      category: 'Business',
      questions: [
        {
          text: 'How do you validate a business idea before investing time and money?',
          answers: [
            'Talk to potential customers. Do they have this problem? Would they pay?',
            'Build an MVP or landing page to test interest before full development.',
            'Research competitors. If none exist, ask why. If many exist, find your edge.',
          ],
        },
        {
          text: 'What are the most important metrics for a startup to track?',
          answers: [
            'Revenue, customer acquisition cost (CAC), and lifetime value (LTV).',
            'Cash runway and burn rate. Know how long you can survive.',
            'User engagement and retention rates for product-market fit.',
          ],
        },
        {
          text: 'How do you find your first customers?',
          answers: [
            'Leverage your network. Ask for intros and referrals.',
            'Go where your customers are: forums, communities, events.',
          ],
        },
        {
          text: 'When should you hire your first employee?',
          answers: [
            'When you have consistent revenue and a clear role to fill.',
            'When you\'re turning down work because you\'re at capacity.',
          ],
        },
        {
          text: 'How do you deal with imposter syndrome as an entrepreneur?',
          answers: [
            'Remember everyone starts somewhere. Focus on progress, not perfection.',
            'Find a mentor or peer group. You\'re not alone in feeling this way.',
          ],
        },
      ],
    },
    {
      category: 'Other',
      questions: [
        {
          text: 'What are some underrated life skills everyone should learn?',
          answers: [
            'Basic cooking, budgeting, and time management.',
            'Active listening and conflict resolution.',
            'Touch typing and keyboard shortcuts for productivity.',
          ],
        },
        {
          text: 'How do you make friends as an adult?',
          answers: [
            'Join clubs, classes, or groups based on your interests.',
            'Be consistent. Show up regularly and initiate plans.',
            'Be vulnerable and authentic. Deep friendships require openness.',
          ],
        },
        {
          text: 'What are good habits to develop in your 20s?',
          answers: [
            'Start saving and investing early. Compound interest is powerful.',
            'Build a professional network and maintain relationships.',
          ],
        },
        {
          text: 'How do you choose where to live?',
          answers: [
            'Consider career opportunities, cost of living, and quality of life.',
            'Visit first if possible. Spend time in different neighborhoods.',
          ],
        },
        {
          text: 'What are signs you should change careers?',
          answers: [
            'Constant dread on Sunday nights. No growth or learning.',
            'Your values no longer align with your work.',
          ],
        },
      ],
    },
  ];

  // Create questions and answers
  let totalQuestions = 0;
  let totalAnswers = 0;

  for (const data of sampleData) {
    const category = categories.find((c) => c.name === data.category);
    if (!category) continue;

    for (let i = 0; i < data.questions.length; i++) {
      const questionData = data.questions[i];
      const questionUser = users[i % users.length];

      // Create question
      const question = await prisma.note.create({
        data: {
          type: 'QUESTION',
          categoryId: category.id,
          userId: questionUser.id,
          text: questionData.text,
        },
      });
      totalQuestions++;

      // Create answers
      for (let j = 0; j < questionData.answers.length; j++) {
        const answerUser = users[(i + j + 1) % users.length];
        await prisma.note.create({
          data: {
            type: 'ANSWER',
            parentId: question.id,
            categoryId: category.id,
            userId: answerUser.id,
            text: questionData.answers[j],
          },
        });
        totalAnswers++;
      }

      // Accept first answer for some questions (not all)
      if (i % 2 === 0 && questionData.answers.length > 0) {
        const firstAnswer = await prisma.note.findFirst({
          where: {
            type: 'ANSWER',
            parentId: question.id,
          },
        });
        if (firstAnswer) {
          await prisma.note.update({
            where: { id: question.id },
            data: { acceptedAnswerId: firstAnswer.id },
          });
        }
      }
    }

    console.log(`✅ Seeded ${data.category}: ${data.questions.length} questions`);
  }

  console.log(`\n🎉 Seeding complete!`);
  console.log(`📊 Summary:`);
  console.log(`   - ${categories.length} categories`);
  console.log(`   - ${users.length} demo users`);
  console.log(`   - ${totalQuestions} questions`);
  console.log(`   - ${totalAnswers} answers`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
