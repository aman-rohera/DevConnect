import { z } from 'zod';

const emptyOrUrl = z.union([z.literal(''), z.string().url()]).optional();

export const createCompanyRequestSchema = z.object({
  body: z.object({
    companyName: z.string().min(2, "Company name must be at least 2 characters"),
    slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
    website: emptyOrUrl,
    industry: z.string().optional(),
    size: z.string().optional(),
    headquarters: z.string().optional(),
    description: z.string().optional(),
    logoUrl: emptyOrUrl,
    coverUrl: emptyOrUrl,
  })
});
