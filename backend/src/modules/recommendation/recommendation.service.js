import { getNeo4jSession } from '../../config/neo4j.js';
import prisma from '../../config/db.js';

/**
 * Syncs a user and their skills from PostgreSQL to Neo4j
 * This should be called whenever a user updates their profile.
 */
export const syncUserToNeo4j = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      skills: {
        include: { skill: true }
      }
    }
  });

  if (!user) return null;

  const session = getNeo4jSession();
  try {
    // 1. Upsert User Node
    await session.run(
      `
      MERGE (u:User {id: $id})
      SET u.fullName = $fullName, u.headline = $headline, u.avatarUrl = $avatarUrl
      `,
      {
        id: user.id,
        fullName: user.fullName || '',
        headline: user.headline || '',
        avatarUrl: user.avatarUrl || ''
      }
    );

    // 2. Remove old skills relationships for this user
    await session.run(
      `
      MATCH (u:User {id: $id})-[r:HAS_SKILL]->()
      DELETE r
      `,
      { id: user.id }
    );

    // 3. Upsert Skills and Create Relationships
    for (const userSkill of user.skills) {
      const skillName = userSkill.skill.name;
      await session.run(
        `
        MATCH (u:User {id: $userId})
        MERGE (s:Skill {name: $skillName})
        MERGE (u)-[:HAS_SKILL]->(s)
        `,
        { userId: user.id, skillName: skillName.trim() }
      );
    }
    
    return true;
  } catch (error) {
    console.error('Error syncing user to Neo4j:', error);
    throw error;
  } finally {
    await session.close();
  }
};

/**
 * Recommends users based on shared skills.
 */
export const getRecommendations = async (userId) => {
  const session = getNeo4jSession();
  try {
    const result = await session.run(
      `
      MATCH (u:User {id: $userId})-[:HAS_SKILL]->(s:Skill)<-[:HAS_SKILL]-(other:User)
      WITH other, COUNT(s) AS commonSkills, COLLECT(s.name) AS sharedSkills
      ORDER BY commonSkills DESC
      LIMIT 10
      RETURN other { .id, .fullName, .headline, .avatarUrl } AS recommendedUser, commonSkills, sharedSkills
      `,
      { userId }
    );

    const recommendations = result.records.map(record => ({
      user: record.get('recommendedUser'),
      commonSkills: record.get('commonSkills').toInt(),
      sharedSkills: record.get('sharedSkills')
    }));

    return recommendations;
  } catch (error) {
    console.error('Error fetching recommendations from Neo4j:', error);
    throw error;
  } finally {
    await session.close();
  }
};
