import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';
import prisma from '../../src/config/db.js';

export const buildUser = (overrides = {}) => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  return {
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    password: 'Password123',
    fullName: `${firstName} ${lastName}`,
    headline: faker.person.jobTitle(),
    bio: faker.lorem.sentence(),
    avatarUrl: faker.image.avatar(),
    education: [
      {
        school: faker.company.name() + ' University',
        degree: 'Bachelor of Science in Computer Science',
        startYear: '2020',
        endYear: '2024'
      }
    ],
    experience: [
      {
        company: faker.company.name(),
        role: 'Software Engineer',
        startDate: 'June 2024',
        endDate: 'Present',
        description: faker.lorem.paragraph()
      }
    ],
    certificates: [
      {
        name: 'AWS Certified Cloud Practitioner',
        issuer: 'Amazon Web Services',
        issueDate: 'January 2025',
        link: 'https://aws.amazon.com'
      }
    ],
    ...overrides
  };
};

const parseDate = (val, fallback = null) => {
  if (!val || val === 'Present' || val === 'present') return fallback;
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? fallback : parsed;
};

export const createUser = async (overrides = {}) => {
  const data = buildUser(overrides);
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(data.password, salt);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      role: data.role || 'USER',
      profile: {
        create: {
          headline: data.headline || '',
          bio: data.bio || '',
          avatarUrl: data.avatarUrl || ''
        }
      },
      education: {
        create: (data.education || []).map(edu => ({
          school: edu.school,
          degree: edu.degree || '',
          fieldOfStudy: edu.fieldOfStudy || '',
          startDate: parseDate(edu.startDate, edu.startYear ? new Date(`${edu.startYear}-01-01`) : new Date()),
          endDate: parseDate(edu.endDate, edu.endYear ? new Date(`${edu.endYear}-01-01`) : null)
        }))
      },
      experiences: {
        create: (data.experience || []).map(exp => ({
          companyName: exp.company || exp.companyName,
          title: exp.role || exp.title,
          location: exp.location || '',
          type: exp.type || 'ON_SITE',
          isCurrent: exp.isCurrent || false,
          startDate: parseDate(exp.startDate, new Date()),
          endDate: parseDate(exp.endDate, null),
          description: exp.description || ''
        }))
      }
    },
    include: {
      profile: true,
      education: true,
      experiences: true
    }
  });

  // Handle skills if provided
  if (data.skills && Array.isArray(data.skills)) {
    for (const skillName of data.skills) {
      const skill = await prisma.skill.upsert({
        where: { name: skillName },
        update: {},
        create: { name: skillName }
      });

      await prisma.userSkill.create({
        data: {
          userId: user.id,
          skillId: skill.id
        }
      });
    }
  }

  return { ...user, password: data.password };
};

export const buildPost = (overrides = {}) => {
  return {
    content: faker.lorem.paragraph(),
    imageUrl: faker.image.url(),
    ...overrides
  };
};

export const createPost = async (userId, overrides = {}) => {
  const data = buildPost(overrides);
  return prisma.post.create({
    data: {
      userId,
      content: data.content,
      imageUrl: data.imageUrl
    }
  });
};

export const createConnection = async (senderId, receiverId, overrides = {}) => {
  return prisma.connection.create({
    data: {
      senderId,
      receiverId,
      status: overrides.status || 'PENDING'
    }
  });
};

export const createProject = async (userId, overrides = {}) => {
  return prisma.project.create({
    data: {
      userId,
      title: overrides.title || faker.commerce.productName(),
      description: overrides.description || faker.commerce.productDescription(),
      projectUrl: overrides.projectUrl || faker.internet.url(),
      repoUrl: overrides.repoUrl || faker.internet.url()
    }
  });
};
