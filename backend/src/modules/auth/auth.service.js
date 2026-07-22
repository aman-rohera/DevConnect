import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../../config/db.js';
import dotenv from 'dotenv';
import AppError from '../../utils/AppError.js';
import { sendWelcomeEmail, sendPasswordResetOtpEmail } from '../../utils/email.service.js';

dotenv.config();

const formatUserResponse = (user) => {
  if (!user) return null;
  const skillsList = user.skills ? user.skills.map((s) => s.skill.name) : [];
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    profile: user.profile ? {
      headline: user.profile.headline || '',
      bio: user.profile.bio || '',
      location: user.profile.location || '',
      website: user.profile.website || '',
      avatar_url: user.profile.avatarUrl || '',
      cover_url: user.profile.coverUrl || '',
      skills: skillsList
    } : null,
    skills: skillsList,
    updated_at: user.updatedAt ? user.updatedAt.toISOString() : new Date().toISOString(),
  };
};

const getUserById = async (userId) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      skills: {
        include: {
          skill: true,
        },
      },
    },
  });
};

const registerUser = async (email, password, fullName, headline = '', skillsString = '') => {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  if (existingUser) {
    throw new AppError('User with this email already exists.', 400);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  const baseUsername = fullName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const username = baseUsername + Math.floor(Math.random() * 10000);

  const newUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        username,
        passwordHash,
        fullName,
        profile: {
          create: {
            headline,
          }
        }
      },
      include: {
        profile: true
      }
    });

    if (skillsString && typeof skillsString === 'string') {
      const skillsList = skillsString
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const skillName of skillsList) {
        const skill = await tx.skill.upsert({
          where: { name: skillName },
          update: {},
          create: { name: skillName },
        });

        await tx.userSkill.create({
          data: {
            userId: user.id,
            skillId: skill.id,
          },
        });
      }
    }

    const createdUser = await tx.user.findUnique({
      where: { id: user.id },
      include: {
        profile: true,
        skills: {
          include: { skill: true },
        },
      },
    });

    return createdUser;
  }, {
    timeout: 15000 // Increase timeout for tests
  });

  // Await email delivery so cloud container (Render) completes network transmission
  try {
    await sendWelcomeEmail({ email: newUser.email, fullName: newUser.fullName });
  } catch (err) {
    console.error('[Email Service Error]:', err);
  }

  return newUser;
};

const createSession = async (userId, ipAddress, device) => {
  const refreshToken = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  const session = await prisma.userSession.create({
    data: {
      userId,
      token: refreshToken,
      ipAddress,
      device,
      expiresAt
    },
    include: { user: true }
  });

  const accessToken = jwt.sign(
    { id: userId, email: session.user?.email, role: session.user?.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' } // 15 minutes for access token
  );

  return { accessToken, refreshToken, expiresAt };
};

const loginUser = async (email, password, ipAddress, device) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      profile: true,
      skills: {
        include: { skill: true },
      },
    },
  });

  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401);
  }

  const tokens = await createSession(user.id, ipAddress, device);

  return {
    tokens,
    user,
  };
};

const logoutUser = async (refreshToken) => {
  if (refreshToken) {
    await prisma.userSession.deleteMany({
      where: { token: refreshToken }
    });
  }
};

const logoutAllDevices = async (userId) => {
  await prisma.userSession.deleteMany({
    where: { userId }
  });
};

const refreshAccessToken = async (refreshToken, ipAddress, device) => {
  if (!refreshToken) {
    throw new AppError('Refresh token required', 401);
  }

  const session = await prisma.userSession.findUnique({
    where: { token: refreshToken },
    include: { user: true }
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.userSession.delete({ where: { id: session.id } });
    }
    throw new AppError('Invalid or expired refresh token', 401);
  }

  // Token Rotation: Delete old session, create new one
  await prisma.userSession.delete({ where: { id: session.id } });

  const tokens = await createSession(session.userId, ipAddress, device);

  return tokens;
};

const generatePasswordResetOtp = async (email) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    throw new AppError('No account found with this email address.', 404);
  }

  if (user.isSuspended) {
    throw new AppError('This account is suspended. Please contact support.', 403);
  }

  // Generate cryptographically secure 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  // Invalidate previous active OTPs for this email
  await prisma.passwordResetOtp.updateMany({
    where: { email: email.toLowerCase(), used: false },
    data: { used: true },
  });

  // Store new OTP
  await prisma.passwordResetOtp.create({
    data: {
      email: email.toLowerCase(),
      otp,
      expiresAt,
    },
  });

  // Send OTP email via Nodemailer
  const emailResult = await sendPasswordResetOtpEmail({
    email: user.email,
    fullName: user.fullName,
    otp,
  });

  return {
    email: user.email,
    simulated: emailResult?.simulated || false,
    otp: emailResult?.simulated ? otp : undefined,
  };
};

const verifyPasswordResetOtp = async (email, otp) => {
  const record = await prisma.passwordResetOtp.findFirst({
    where: {
      email: email.toLowerCase(),
      otp,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    throw new AppError('Invalid or expired OTP code. Please request a new code.', 400);
  }

  return { valid: true };
};

const resetPasswordWithOtp = async (email, otp, newPassword) => {
  const record = await prisma.passwordResetOtp.findFirst({
    where: {
      email: email.toLowerCase(),
      otp,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    throw new AppError('Invalid or expired OTP code. Please request a new code.', 400);
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    throw new AppError('User account not found.', 404);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  // Update password and mark OTP as used in a transaction
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    }),
    prisma.passwordResetOtp.update({
      where: { id: record.id },
      data: { used: true },
    }),
    prisma.userSession.deleteMany({
      where: { userId: user.id },
    }),
  ]);

  return { success: true };
};

export {
  formatUserResponse,
  getUserById,
  registerUser,
  loginUser,
  logoutUser,
  logoutAllDevices,
  refreshAccessToken,
  sendWelcomeEmail,
  generatePasswordResetOtp,
  verifyPasswordResetOtp,
  resetPasswordWithOtp,
};

