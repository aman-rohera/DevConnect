import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

export const formatUserResponse = (user) => {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    profile: {
      id: user.id,
      full_name: user.fullName,
      headline: user.headline || '',
      bio: user.bio || '',
      avatar_url: user.avatarUrl || '',
      skills: user.skills ? user.skills.map((s) => s.skill.name) : [],
      updated_at: user.updatedAt ? user.updatedAt.toISOString() : new Date().toISOString(),
    },
  };
};

export const getUserById = async (userId) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      skills: {
        include: {
          skill: true,
        },
      },
    },
  });
};

export const registerUser = async (email, password, fullName, headline = '', skillsString = '') => {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  if (existingUser) {
    throw new Error('User with this email already exists.');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Perform database registration in a transaction to handle inline skills
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        headline,
      },
    });

    if (skillsString && typeof skillsString === 'string') {
      const skillsList = skillsString
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const skillName of skillsList) {
        // Find or create the skill in master table
        const skill = await tx.skill.upsert({
          where: { name: skillName },
          update: {},
          create: { name: skillName },
        });

        // Link in junction table
        await tx.userSkill.create({
          data: {
            userId: user.id,
            skillId: skill.id,
          },
        });
      }
    }

    // Retrieve fully populated user details
    const finalUser = await tx.user.findUnique({
      where: { id: user.id },
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
      },
    });

    return finalUser;
  });
};

export const loginUser = async (email, password) => {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      skills: {
        include: {
          skill: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error('Invalid email or password.');
  }

  // Verify password matches hash
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new Error('Invalid email or password.');
  }

  // Create JWT Token
  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // Token expires in 7 days
  );

  return {
    session: {
      access_token: token,
      refresh_token: 'dummy_refresh_token_for_devconnect',
      expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days expiration timestamp
    },
    user,
  };
};
