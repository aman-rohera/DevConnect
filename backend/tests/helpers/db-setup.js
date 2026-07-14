import prisma from '../../src/config/db.js';
import { getNeo4jSession } from '../../src/config/neo4j.js';

export const cleanupDatabase = async () => {
  // Truncate Postgres tables in dependency order
  const tables = ['user_skills', 'skills', 'projects', 'connections', 'shares', 'likes', 'comments', 'posts', 'users'];
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
    } catch (e) {
      // Fail silently if tables are missing or not set up
    }
  }

  // Clear Neo4j nodes if driver is accessible
  try {
    const session = getNeo4jSession();
    await session.run('MATCH (n) DETACH DELETE n');
    await session.close();
  } catch (error) {
    // Fail silently if Neo4j is not connected or throws an error
  }
};
