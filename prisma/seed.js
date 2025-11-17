const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: 'demo@studentfintrack.app' },
    update: {},
    create: { email: 'demo@studentfintrack.app', name: 'Demo User' }
  });
  console.log('Seeded demo user');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
