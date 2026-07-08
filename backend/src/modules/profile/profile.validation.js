import { z } from 'zod';

const updateProfileSchema = z.object({
  body: z.object({
    headline: z.string().max(255, 'Headline cannot exceed 255 characters').optional(),
    bio: z.string().optional(),
    avatarUrl: z.string().optional().or(z.null()),
    skills: z.array(z.string().min(1, 'Skill name cannot be empty')).optional(),
    projects: z.array(
      z.object({
        id: z.string().uuid('Invalid project ID').optional(),
        title: z.string().min(1, 'Project title cannot be empty'),
        description: z.string().min(1, 'Project description cannot be empty'),
        projectUrl: z.string().optional().or(z.null()),
        repoUrl: z.string().optional().or(z.null()),
      })
    ).optional(),
    experience: z.array(
      z.object({
        company: z.string().min(1, 'Company name cannot be empty'),
        role: z.string().min(1, 'Role cannot be empty'),
        startDate: z.string().min(1, 'Start date cannot be empty'),
        endDate: z.string().optional().or(z.null()),
        description: z.string().optional().or(z.null()),
      })
    ).optional(),
    education: z.array(
      z.object({
        school: z.string().min(1, 'School/College name cannot be empty'),
        degree: z.string().min(1, 'Degree/Field cannot be empty'),
        startYear: z.string().min(1, 'Start year cannot be empty'),
        endYear: z.string().optional().or(z.null()),
      })
    ).optional(),
    certificates: z.array(
      z.object({
        name: z.string().min(1, 'Certificate name cannot be empty'),
        issuer: z.string().min(1, 'Issuer cannot be empty'),
        issueDate: z.string().optional().or(z.null()),
        link: z.string().optional().or(z.null()),
      })
    ).optional()
  })
});

const getProfileByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID format')
  })
});

export { updateProfileSchema, getProfileByIdSchema };
