const { PrismaClient } = require('@prisma/client');

// Client Prisma ORM centralisé pour PostgreSQL
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

module.exports = prisma;
