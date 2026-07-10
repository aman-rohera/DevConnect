import { z } from 'zod';

export const paginationSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().transform(Number),
    limit: z.string().regex(/^\d+$/).optional().transform(Number),
    search: z.string().optional(),
    status: z.string().optional()
  })
});

export const updateUserSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    role: z.enum(['USER', 'ADMIN', 'MODERATOR', 'RECRUITER']).optional(),
    isSuspended: z.boolean().optional()
  })
});

export const rejectCompanyRequestSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    reason: z.string().min(5, "Rejection reason must be at least 5 characters")
  })
});

export const suspendCompanySchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    isSuspended: z.boolean()
  })
});

export const suspendJobSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    isSuspended: z.boolean()
  })
});

export const paramIdSchema = z.object({
  params: z.object({ id: z.string().uuid() })
});
