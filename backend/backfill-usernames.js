import prisma from './src/config/db.js';

async function main() {
  const users = await prisma.user.findMany({ where: { username: null } });
  for (const user of users) {
    const username = user.fullName.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 10000);
    await prisma.user.update({
      where: { id: user.id },
      data: { username }
    });
  }
  console.log(`Backfilled ${users.length} users.`);
  process.exit(0);
}
main();
