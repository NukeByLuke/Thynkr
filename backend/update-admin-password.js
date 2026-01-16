/**
 * Update admin password to meet 8-character requirement
 * Run with: node update-admin-password.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@thynkr.app'; // Correct email from database
  const newPassword = 'admin123'; // 8 characters - meets validation
  
  // Hash the password
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  // Update the user
  const user = await prisma.user.update({
    where: { email },
    data: {
      password: hashedPassword,
    },
  });
  
  console.log('✅ Admin password updated successfully!');
  console.log(`Email: ${email}`);
  console.log(`New password: ${newPassword}`);
  console.log(`User role: ${user.role}`);
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
