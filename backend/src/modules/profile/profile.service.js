import prisma from '../../config/db.js';

export const getUserProfile = async (userId) => {
  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      headline: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
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

  if (!profile) return null;

  // Flatten the skills array so it returns simple string array like ["React.js", "Node.js"]
  const formattedSkills = profile.skills.map(s => s.skill.name);
  return { ...profile, skills: formattedSkills };
};

export const updateUserProfile = async (userId, data) => {
  const { headline, bio, avatarUrl, skills } = data;

  // Use a Transaction to ensure all database steps succeed together
  return await prisma.$transaction(async (tx) => {
    // 1. Update basic profile info
    await tx.user.update({
      where: { id: userId },
      data: { headline, bio, avatarUrl }
    });

    // 2. If skills are provided, update the many-to-many junction table
    if (skills && Array.isArray(skills)) {
      // Delete existing skill links
      await tx.userSkill.deleteMany({
        where: { userId }
      });

      // Link new skills
      for (const skillName of skills) {
        // Upsert the skill in the master table (find or create)
        const skill = await tx.skill.upsert({
          where: { name: skillName.trim() },
          update: {},
          create: { name: skillName.trim() }
        });

        // Insert into junction table
        await tx.userSkill.create({
          data: {
            userId,
            skillId: skill.id
          }
        });
      }
    }

    // Return the updated profile with new skills
    const finalProfile = await getUserProfile(userId);
    return finalProfile;
  });
};
