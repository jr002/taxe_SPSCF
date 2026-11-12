const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const agents = await prisma.agents.findMany({
    select: { id_agent: true, email: true, role: true, statut: true, nom: true, prenom: true }
  });
  console.log('AGENTS_LIST:', JSON.stringify(agents, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

