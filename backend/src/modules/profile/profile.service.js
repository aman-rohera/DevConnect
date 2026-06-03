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
      education: true,
      experience: true,
      certificates: true,
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
  const { headline, bio, avatarUrl, skills, projects, education, experience, certificates } = data;

  // 1. Update basic profile info & JSON fields
  await prisma.user.update({
    where: { id: userId },
    data: { 
      headline, 
      bio, 
      avatarUrl,
      education: education || [],
      experience: experience || [],
      certificates: certificates || []
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

  // 3. If projects are provided, update projects table
  if (projects && Array.isArray(projects)) {
    // Delete existing project links
    await prisma.project.deleteMany({
      where: { userId }
    });

    // Insert new projects
    for (const proj of projects) {
      await prisma.project.create({
        data: {
          userId,
          title: proj.title,
          description: proj.description,
          projectUrl: proj.projectUrl || '',
          repoUrl: proj.repoUrl || ''
        }
      });
    }
  }

  // Return the updated profile with new skills
  const finalProfile = await getUserProfile(userId);
  return finalProfile;
};
