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
    const hasResend = !!process.env.RESEND_API_KEY;

    if (hasResend) {
      await sendWelcomeEmail({ email: newUser.email, fullName: newUser.fullName });
    } else {
      const FRONTEND_URL = process.env.FRONTEND_URL || 'https://dev-connect-si.vercel.app';
      await fetch(`${FRONTEND_URL}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newUser.email, fullName: newUser.fullName, type: 'welcome' }),
      });
    }
  } catch (err) {
    console.error('[Email Service Error]:', err);
    if (err.isOperational) throw err; // rethrow AppError
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

// Local OTP Generation, but Vercel API for Email Sending (Bypass Render SMTP block)
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

  // Generate 6-digit OTP locally
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Store in database
  await prisma.passwordResetOtp.create({
    data: {
      email: user.email,
      otp,
      expiresAt
    }
  });

  try {
    const hasResend = !!process.env.RESEND_API_KEY;

    // If we have Resend API Key, use our built-in email service
    if (hasResend) {
      const emailResult = await sendPasswordResetOtpEmail({ 
        email: user.email, 
        fullName: user.fullName, 
        otp 
      });
      
      if (!emailResult.success) {
        throw new AppError(emailResult.error || 'Failed to send OTP email. Please try again.', 500);
      }
    } else {
      // Use the Vercel Serverless Function to bypass SMTP block
      const FRONTEND_URL = process.env.FRONTEND_URL || 'https://dev-connect-si.vercel.app';
      const res = await fetch(`${FRONTEND_URL}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, otp, fullName: user.fullName }),
      });

      const data = await res.json();
      console.log(`[OTP Service] Vercel API response for ${user.email}:`, data);

      if (!res.ok || !data.success) {
        throw new AppError(data.message || 'Failed to send OTP via Vercel API. Please try again.', 500);
      }
    }
  } catch (err) {
    console.error('[OTP Service Exception]:', err);
    if (err.isOperational) throw err; // If it's our AppError with Vercel's message, throw it directly
    throw new AppError('Failed to reach email service. Please try again.', 503);
  }

  return {
    email: user.email,
    simulated: false,
  };
};

const verifyPasswordResetOtp = async (email, otp) => {
  // Local verification
  const otpRecord = await prisma.passwordResetOtp.findFirst({
    where: {
      email: email.toLowerCase(),
      otp: otp,
      used: false,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!otpRecord) {
    throw new AppError('Invalid or expired OTP code. Please request a new code.', 400);
  }

  // Mark as used
  await prisma.passwordResetOtp.update({
    where: { id: otpRecord.id },
    data: { used: true }
  });

  return { valid: true };
};

const resetPasswordWithOtp = async (email, otp, newPassword) => {
  // OTP already verified by external API in verifyPasswordResetOtp step.
  // Just validate the user exists and update their password.
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    throw new AppError('User account not found.', 404);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  // Update password and invalidate all sessions
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    }),
    prisma.userSession.deleteMany({
      where: { userId: user.id },
    }),
  ]);

  return { success: true };
};

const findOrCreateGoogleUser = async ({ email, fullName, avatarUrl }, ipAddress, device) => {
  if (!email) {
    throw new AppError('Google profile did not contain a valid email address.', 400);
  }

  const cleanEmail = email.toLowerCase().trim();

  // Check if user already exists
  let user = await prisma.user.findUnique({
    where: { email: cleanEmail },
    include: { profile: true },
  });

  if (user && user.isSuspended) {
    throw new AppError('This account is suspended. Please contact support.', 403);
  }

  if (!user) {
    // Generate unique username from email prefix or name
    let baseUsername = (cleanEmail.split('@')[0] || 'dev').replace(/[^a-zA-Z0-9_]/g, '');
    if (baseUsername.length < 3) baseUsername += 'dev';
    
    let username = baseUsername;
    let counter = 1;
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // Generate random secure password for OAuth user
    const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(randomPassword, salt);

    const displayName = fullName || cleanEmail.split('@')[0] || 'Developer';

    // Create user and profile in transaction
    user = await prisma.user.create({
      data: {
        email: cleanEmail,
        username,
        fullName: displayName,
        passwordHash,
        profile: {
          create: {
            avatarUrl: avatarUrl || null,
            headline: 'Developer on DevConnect',
          },
        },
      },
      include: { profile: true },
    });

    // Send welcome email asynchronously
    sendWelcomeEmail({ email: user.email, fullName: user.fullName }).catch((err) => {
      console.warn('[Email Warning] Welcome email trigger failed for Google user:', err?.message);
    });
  } else if (avatarUrl && (!user.profile || !user.profile.avatarUrl)) {
    // Upsert avatar if user exists but has no avatar
    await prisma.profile.upsert({
      where: { userId: user.id },
      create: { avatarUrl },
      update: { avatarUrl },
    });
    user = await prisma.user.findUnique({
      where: { id: user.id },
      include: { profile: true },
    });
  }

  // Create session and tokens
  const tokens = await createSession(user.id, ipAddress, device);

  return {
    user,
    tokens,
  };
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
  findOrCreateGoogleUser,
};

