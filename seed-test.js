const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const accounts = [
  { email: 'free@test.local', username: 'free_user', password: 'Password123!', role: 'FREE' },
  { email: 'pro@test.local', username: 'pro_user', password: 'Password123!', role: 'PRO' },
  { email: 'premium@test.local', username: 'premium_user', password: 'Password123!', role: 'PREMIUM' },
  { email: 'admin@test.local', username: 'admin', password: 'AdminPass123!', role: 'ADMIN' }
];

(async () => {
  console.log('🌱 Seeding test accounts...');
  for (const acc of accounts) {
    try {
      const existing = await prisma.user.findUnique({ where: { email: acc.email } });
      if (existing) {
        console.log(`✓ User ${acc.email} already exists, skipping...`);
        continue;
      }
      const hashedPassword = await bcrypt.hash(acc.password, 10);
      await prisma.user.create({
        data: {
          email: acc.email,
          username: acc.username,
          password: hashedPassword,
          role: acc.role,
          emailVerified: true
        }
      });
      console.log(`✓ Created ${acc.role} account: ${acc.email}`);
    } catch (error) {
      console.error(`✗ Failed to create ${acc.email}:`, error.message);
    }
  }
  console.log('✅ Test account seeding complete!');
  await prisma.$disconnect();
})().catch(console.error);
