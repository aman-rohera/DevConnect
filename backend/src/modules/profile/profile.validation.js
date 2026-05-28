import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    headline: z.string().max(255, 'Headline cannot exceed 255 characters').optional(),
    bio: z.string().optional(),
    avatarUrl: z.string().url('Invalid avatar image URL format').or(z.string().length(0)).optional().or(z.null()),
    skills: z.array(z.string().min(1, 'Skill name cannot be empty')).optional()
  })
});

export const getProfileByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID format')
  })
});
