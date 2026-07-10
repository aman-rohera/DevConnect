import { z } from 'zod';

export const userSearchSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    location: z.string().optional(),
    currentCompany: z.string().optional(),
    skill: z.string().optional(),
    sort: z.enum(['relevance', 'newest']).optional().default('relevance'),
    page: z.string().regex(/^\d+$/).optional().default('1'),
    limit: z.string().regex(/^\d+$/).optional().default('10'),
  })
});
