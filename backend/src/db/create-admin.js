const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

(async () => {
  try {
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    
    const user = await prisma.user.upsert({
      where: { email: 'lukedreise@gmail.com' },
      update: {
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: true,
      },
      create: {
        email: 'lukedreise@gmail.com',
        username: 'lukedreise',
        password: hashedPassword,
        firstName: 'Luke',
        lastName: 'Dreise',
        role: 'ADMIN',
        emailVerified: true,
      },
    });
    
    console.log('✅ Created/updated admin account:', user.email);
    console.log('Email: lukedreise@gmail.com');
    console.log('Password: Admin123!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
