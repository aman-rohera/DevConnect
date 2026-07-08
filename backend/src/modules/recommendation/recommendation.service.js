import { getNeo4jSession } from '../../config/neo4j.js';
import prisma from '../../config/db.js';

/**
 * Syncs a user and their skills from PostgreSQL to Neo4j
 * This should be called whenever a user updates their profile.
 */
const syncUserToNeo4j = async (userId) => {
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

    // 4. Upsert Education/Schools
    // Remove old education relationships
    await session.run(
      `
      MATCH (u:User {id: $id})-[r:ATTENDED]->()
      DELETE r
      `,
      { id: user.id }
    );

    if (Array.isArray(user.education)) {
      for (const edu of user.education) {
        if (edu && edu.school) {
          const schoolName = edu.school.trim();
          await session.run(
            `
            MATCH (u:User {id: $userId})
            MERGE (sch:School {name: $schoolName})
            MERGE (u)-[:ATTENDED]->(sch)
            `,
            { userId: user.id, schoolName }
          );
        }
      }
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
const getRecommendations = async (userId) => {
  // First, get all existing connection targets to exclude them from recommendations
  const existingConnections = await prisma.connection.findMany({
    where: {
      OR: [
        { senderId: userId },
        { receiverId: userId }
      ]
    }
  });

  const excludedIds = existingConnections.map(c =>
    c.senderId === userId ? c.receiverId : c.senderId
  );

  const session = getNeo4jSession();
  try {
    const result = await session.run(
      `
      MATCH (u:User {id: $userId})
      MATCH (other:User)
      WHERE u <> other AND NOT other.id IN $excludedIds
      
      // Calculate shared skills
      OPTIONAL MATCH (u)-[:HAS_SKILL]->(s:Skill)<-[:HAS_SKILL]-(other)
      WITH u, other, COUNT(DISTINCT s) AS commonSkills, COLLECT(DISTINCT s.name) AS sharedSkills
      
      // Calculate mutual connections
      OPTIONAL MATCH (u)-[:CONNECTED_TO]-(mutual:User)-[:CONNECTED_TO]-(other)
      WITH u, other, commonSkills, sharedSkills, COUNT(DISTINCT mutual) AS mutualConnections
      
      // Calculate shared education (school/university)
      OPTIONAL MATCH (u)-[:ATTENDED]->(edu:School)<-[:ATTENDED]-(other)
      WITH other, commonSkills, sharedSkills, mutualConnections, COUNT(DISTINCT edu) AS sharedEducation
      
      // Only recommend if they have AT LEAST ONE thing in common
      WHERE commonSkills > 0 OR mutualConnections > 0 OR sharedEducation > 0
      
      // Calculate a combined score for ordering
      WITH other, commonSkills, sharedSkills, mutualConnections, sharedEducation,
           (commonSkills * 1) + (mutualConnections * 3) + (sharedEducation * 2) AS score
      ORDER BY score DESC, mutualConnections DESC, commonSkills DESC
      LIMIT 10
      RETURN other { .id, .fullName, .headline, .avatarUrl } AS recommendedUser, commonSkills, sharedSkills, mutualConnections
      `,
      { userId, excludedIds }
    );

    const recommendations = result.records.map(record => ({
      user: record.get('recommendedUser'),
      commonSkills: record.get('commonSkills').toInt(),
      sharedSkills: record.get('sharedSkills'),
      mutualConnections: record.get('mutualConnections').toInt()
    }));

    return recommendations;
  } catch (error) {
    console.error('Error fetching recommendations from Neo4j:', error);
    throw error;
  } finally {
    await session.close();
  }
};

export { syncUserToNeo4j, getRecommendations };
