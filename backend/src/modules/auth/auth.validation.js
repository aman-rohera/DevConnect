import { z } from 'zod';

export const registerSchema = z.object({
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

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address'),
    password: z
      .string({ required_error: 'Password is required' })
  })
});
