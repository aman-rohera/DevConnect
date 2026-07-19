import prisma from './src/config/db.js';

async function main() {
  const user = await prisma.user.findFirst();
  console.log("User object keys:", Object.keys(user));
  console.log("Username is:", user.username);
  process.exit(0);
}
main();
