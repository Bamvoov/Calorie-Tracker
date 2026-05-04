require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

try {
  const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } }, log: ['query'] });
  prisma.user.findFirst().then(console.log).catch(e => console.error("RUN ERROR:", e.message || e)).finally(() => prisma.$disconnect());
} catch (e) {
  console.error("CONSTRUCTOR ERROR:", e.message || e);
}
