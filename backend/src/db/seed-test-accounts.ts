import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedTestAccounts() {
  console.log('🌱 Seeding test accounts...');

  const testAccounts = [
    {
      email: 'free@test.local',
      username: 'free_user',
      password: 'Password123!',
      role: 'FREE' as Role,
    },
    {
      email: 'pro@test.local',
      username: 'pro_user',
      password: 'Password123!',
      role: 'PRO' as Role,
    },
    {
      email: 'premium@test.local',
      username: 'premium_user',
      password: 'Password123!',
      role: 'PREMIUM' as Role,
    },
    {
      email: 'admin@test.local',
      username: 'admin',
      password: 'AdminPass123!',
      role: 'ADMIN' as Role,
    },
  ];

  for (const account of testAccounts) {
    try {
      // Check if user already exists
      const existing = await prisma.user.findUnique({
        where: { email: account.email },
      });

      if (existing) {
        console.log(`✓ User ${account.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(account.password, 10);

      // Create user
      await prisma.user.create({
        data: {
          email: account.email,
          username: account.username,
          password: hashedPassword,
          role: account.role,
          emailVerified: true, // Auto-verify test accounts
        },
      });

      console.log(`✓ Created ${account.role} account: ${account.email}`);
    } catch (error) {
      console.error(`✗ Failed to create ${account.email}:`, error);
    }
  }

  console.log('✅ Test account seeding complete!');
}

seedTestAccounts()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
