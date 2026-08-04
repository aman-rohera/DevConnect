import { getNeo4jSession } from '../../config/neo4j.js';
import prisma from '../../config/db.js';
import cache from '../../config/cache.js';

/**
 * Syncs a user and their skills from PostgreSQL to Neo4j
 * This should be called whenever a user updates their profile.
 */
const syncUserToNeo4j = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
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
        headline: user.profile?.headline || '',
        avatarUrl: user.profile?.avatarUrl || ''
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
    if (user.skills && Array.isArray(user.skills)) {
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

    if (user.education && Array.isArray(user.education)) {
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
 * PostgreSQL Fallback: Fetches popular active developers for new users with 0 graph matches.
 */
const getFallbackPopularUsers = async (userId, excludedIds = [], limit = 10) => {
  try {
    const popularUsers = await prisma.user.findMany({
      where: {
        id: {
          notIn: [userId, ...excludedIds],
        },
        isSuspended: false,
      },
      take: limit,
      select: {
        id: true,
        fullName: true,
        username: true,
        profile: {
          select: {
            headline: true,
            avatarUrl: true,
          },
        },
        skills: {
          select: {
            skill: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: [
        { posts: { _count: 'desc' } },
        { createdAt: 'desc' },
      ],
    });

    return popularUsers.map((u) => ({
      user: {
        id: u.id,
        fullName: u.fullName,
        username: u.username || u.fullName.toLowerCase().replace(/[^a-z0-9]/g, ''),
        headline: u.profile?.headline || 'Developer on DevConnect',
        avatarUrl: u.profile?.avatarUrl || '',
      },
      commonSkills: 0,
      sharedSkills: u.skills ? u.skills.map((s) => s.skill.name).slice(0, 3) : [],
      mutualConnections: 0,
      isFallback: true,
    }));
  } catch (err) {
    console.error('[Fallback Recommendations Error]:', err?.message || err);
    return [];
  }
};

/**
 * Recommends users based on shared skills (with popular users fallback for new accounts).
 */
const getRecommendations = async (userId) => {
  const cacheKey = `recommendations:${userId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  // 1. Get existing connections to exclude
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

  let recommendations = [];

  // 2. Try Neo4j graph recommendations
  try {
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

      recommendations = result.records.map(record => ({
        user: record.get('recommendedUser'),
        commonSkills: record.get('commonSkills').toInt(),
        sharedSkills: record.get('sharedSkills'),
        mutualConnections: record.get('mutualConnections').toInt()
      }));
    } finally {
      await session.close();
    }
  } catch (error) {
    console.warn('[Neo4j Warning] Graph recommendations unavailable, using popular users fallback:', error?.message);
  }

  // 3. If new user has 0 Neo4j graph matches (or Neo4j offline), fill with top active developers
  if (!recommendations || recommendations.length === 0) {
    recommendations = await getFallbackPopularUsers(userId, excludedIds, 10);
  }

  await cache.set(cacheKey, recommendations, 1800); // Cache for 30 mins
  return recommendations;
};

export { syncUserToNeo4j, getRecommendations };
