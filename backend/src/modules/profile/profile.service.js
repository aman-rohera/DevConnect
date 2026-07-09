import prisma from '../../config/db.js';
import { syncUserToNeo4j } from '../recommendation/recommendation.service.js';

const getUserProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      createdAt: true,
      profile: {
        select: {
          headline: true,
          bio: true,
          location: true,
          website: true,
          avatarUrl: true,
          coverUrl: true,
        }
      },
      education: true,
      experiences: true, // Note: It's 'experiences' in the new schema
      projects: true,
      skills: {
        select: {
          skill: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });

  if (!user) return null;

  // Flatten the skills array so it returns simple string array like ["React.js", "Node.js"]
  const formattedSkills = user.skills ? user.skills.map(s => s.skill.name) : [];
  
  // Format response to maintain backward compatibility or align with expected format
  return { 
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    createdAt: user.createdAt,
    headline: user.profile?.headline || null,
    bio: user.profile?.bio || null,
    location: user.profile?.location || null,
    website: user.profile?.website || null,
    avatarUrl: user.profile?.avatarUrl || null,
    coverUrl: user.profile?.coverUrl || null,
    education: user.education || [],
    experience: user.experiences || [],
    projects: user.projects || [],
    skills: formattedSkills
  };
};

const updateUserProfile = async (userId, data) => {
  const { headline, bio, location, website, avatarUrl, coverUrl, skills } = data;

  // 1. Update basic profile info
  await prisma.user.update({
    where: { id: userId },
    data: { 
      profile: {
        upsert: {
          create: {
            headline,
            bio,
            location,
            website,
            avatarUrl,
            coverUrl
          },
          update: {
            headline,
            bio,
            location,
            website,
            avatarUrl,
            coverUrl
          }
        }
      }
    }
  });

  // 2. If skills are provided, update the many-to-many junction table
  if (skills && Array.isArray(skills)) {
    // Delete existing skill links
    await prisma.userSkill.deleteMany({
      where: { userId }
    });

    // Link new skills
    for (const skillName of skills) {
      if (!skillName) continue;
      // Upsert the skill in the master table (find or create)
      const skill = await prisma.skill.upsert({
        where: { name: skillName.trim() },
        update: {},
        create: { name: skillName.trim() }
      });

      // Insert into junction table
      await prisma.userSkill.create({
        data: {
          userId,
          skillId: skill.id
        }
      });
    }
  }

  // Note: Education, Experience, and Projects should be managed through their respective specific endpoints
  // in a properly normalized architecture, instead of a massive monolith update. We skip bulk replacing them here.

  // 4. Sync profile to Neo4j for recommendations
  try {
    await syncUserToNeo4j(userId);
  } catch (err) {
    console.error('Failed to sync user to neo4j:', err);
    // Don't fail the update if neo4j is down
  }

  // Return the updated profile with new skills
  const finalProfile = await getUserProfile(userId);
  return finalProfile;
};

export { getUserProfile, updateUserProfile };
