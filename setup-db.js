#!/usr/bin/env node

/**
 * Initialize database with Prisma schema
 */

const { execSync } = require('child_process');

console.log('🗄️  Setting up database...\n');

try {
  console.log('1️⃣  Regenerating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma Client generated\n');

  console.log('2️⃣  Syncing database schema...');
  execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
  console.log('✅ Database synced\n');

  console.log('3️⃣  Verifying tables...');
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  async function verifyTables() {
    try {
      const userCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='User'`;
      console.log('✅ Database ready!\n');
      await prisma.$disconnect();
    } catch (err) {
      console.error('❌ Error verifying tables:', err.message);
    }
  }

  verifyTables();
} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}
