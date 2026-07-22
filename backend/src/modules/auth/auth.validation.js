import { z } from 'zod';

const registerSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(6, 'Password must be at least 6 characters long'),
    fullName: z
      .string({ required_error: 'Full name is required' })
      .min(2, 'Full name must be at least 2 characters long'),
    headline: z.string().max(255).optional().or(z.null()),
    skills: z.string().optional().or(z.null())
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address'),
    password: z
      .string({ required_error: 'Password is required' })
  })
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address'),
  })
});

const verifyOtpSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address'),
    otp: z
      .string({ required_error: 'OTP is required' })
      .length(6, 'OTP must be exactly 6 digits'),
  })
});

const resetPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address'),
    otp: z
      .string({ required_error: 'OTP is required' })
      .length(6, 'OTP must be exactly 6 digits'),
    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(6, 'Password must be at least 6 characters long'),
  })
});

export { registerSchema, loginSchema, forgotPasswordSchema, verifyOtpSchema, resetPasswordSchema };

