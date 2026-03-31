require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

try {
  const prisma = new PrismaClient({ url: process.env.DATABASE_URL, log: ['query'] });
  prisma.user.findFirst().then(console.log).catch(e => console.error("RUN ERROR:", e.message || e));
} catch (e) {
  console.error("CONSTRUCTOR ERROR:", e.message || e);
}
