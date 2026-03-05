// Script to create admin user
// Run this from the backend directory with: node create-admin.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    // Create or update admin user
    const admin = await prisma.user.upsert({
      where: { email: 'admin@thynkr.ca' },
      update: {
        role: 'ADMIN',
        password: hashedPassword,
        emailVerified: true,
      },
      create: {
        email: 'admin@thynkr.ca',
        username: 'admin',
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: true,
      },
    });
    
    console.log('✓ Admin user created successfully!');
    console.log('  Email: admin@thynkr.ca');
    console.log('  Password: test123');
    console.log('  Role:', admin.role);
  } catch (error) {
    console.error('✗ Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
