import prisma from '../../config/db.js';
import { syncUserToNeo4j } from '../recommendation/recommendation.service.js';

const getUserProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
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
          certificates: true
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

  const formattedExperiences = (user.experiences || []).map(exp => ({
    id: exp.id,
    company: exp.companyName,
    companyName: exp.companyName,
    role: exp.title,
    title: exp.title,
    location: exp.location,
    type: exp.type,
    isCurrent: exp.isCurrent,
    startDate: exp.startDate,
    endDate: exp.endDate,
    description: exp.description
  }));

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
    experience: formattedExperiences,
    projects: user.projects || [],
    certificates: user.profile?.certificates || [],
    skills: formattedSkills
  };
};

const getProfileByUsername = async (usernameOrId) => {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(usernameOrId);
  
  const user = await prisma.user.findUnique({
    where: isUuid ? { id: usernameOrId } : { username: usernameOrId },
    select: {
      id: true,
      email: true,
      username: true,
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
          certificates: true
        }
      },
      education: true,
      experiences: true,
      projects: true,
      skills: {
        select: {
          skill: { select: { name: true } }
        }
      }
    }
  });

  if (!user) return null;

  const formattedSkills = user.skills ? user.skills.map(s => s.skill.name) : [];
  const formattedExperiences = (user.experiences || []).map(exp => ({
    id: exp.id,
    company: exp.companyName,
    companyName: exp.companyName,
    role: exp.title,
    title: exp.title,
    location: exp.location,
    startDate: exp.startDate,
    endDate: exp.endDate,
    description: exp.description
  }));
  const formattedEducation = (user.education || []).map(edu => ({
    id: edu.id,
    school: edu.school,
    degree: edu.degree,
    fieldOfStudy: edu.fieldOfStudy,
    startDate: edu.startDate,
    endDate: edu.endDate,
    description: edu.description
  }));

  return {
    ...user,
    skills: formattedSkills,
    experiences: formattedExperiences,
    experience: formattedExperiences,
    education: formattedEducation
  };
};

const updateUserProfile = async (userId, data) => {
  const { headline, bio, location, website, avatarUrl, coverUrl, skills, education, experience, projects, certificates } = data;

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

  const parseDate = (val, fallback = null) => {
    if (!val || val === 'Present' || val === 'present') return fallback;
    const parsed = new Date(val);
    return isNaN(parsed.getTime()) ? fallback : parsed;
  };

  // 3. If education is provided, update education table
  if (education && Array.isArray(education)) {
    await prisma.education.deleteMany({
      where: { userId }
    });

    for (const edu of education) {
      await prisma.education.create({
        data: {
          userId,
          school: edu.school,
          degree: edu.degree || '',
          fieldOfStudy: edu.fieldOfStudy || '',
          startDate: parseDate(edu.startDate, edu.startYear ? new Date(`${edu.startYear}-01-01`) : new Date()),
          endDate: parseDate(edu.endDate, edu.endYear ? new Date(`${edu.endYear}-01-01`) : null),
          grade: edu.grade || '',
          activities: edu.activities || '',
          description: edu.description || ''
        }
      });
    }
  }

  // 4. If experience is provided, update experience table
  if (experience && Array.isArray(experience)) {
    await prisma.experience.deleteMany({
      where: { userId }
    });

    for (const exp of experience) {
      await prisma.experience.create({
        data: {
          userId,
          companyName: exp.company || exp.companyName,
          title: exp.role || exp.title,
          location: exp.location || '',
          type: exp.type || 'ON_SITE',
          isCurrent: exp.isCurrent || false,
          startDate: parseDate(exp.startDate, new Date()),
          endDate: parseDate(exp.endDate, null),
          description: exp.description || ''
        }
      });
    }
  }

  // 5. Update projects table
  if (projects && Array.isArray(projects)) {
    await prisma.project.deleteMany({
      where: { userId }
    });

    for (const proj of projects) {
      await prisma.project.create({
        data: {
          userId,
          title: proj.title,
          description: proj.description || '',
          projectUrl: proj.projectUrl || '',
          repoUrl: proj.repoUrl || ''
        }
      });
    }
  }

  // 6. Update certificates table
  if (certificates && Array.isArray(certificates)) {
    const profileRecord = await prisma.profile.findUnique({ where: { userId } });
    if (profileRecord) {
      await prisma.certificate.deleteMany({
        where: { profileId: profileRecord.id }
      });

      for (const cert of certificates) {
        await prisma.certificate.create({
          data: {
            profileId: profileRecord.id,
            name: cert.name,
            issuer: cert.issuer,
            issueDate: parseDate(cert.issueDate, new Date()),
            expiryDate: parseDate(cert.expiryDate, null),
            credentialId: cert.credentialId || '',
            url: cert.url || ''
          }
        });
      }
    }
  }

  // 5. Sync profile to Neo4j for recommendations
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

export { getUserProfile, getProfileByUsername, updateUserProfile };
