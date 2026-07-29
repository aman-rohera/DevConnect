import prisma from '../../config/db.js';
import cache from '../../config/cache.js';

export const searchUsers = async (filters, pagination) => {
  const cacheKey = `search:users:${JSON.stringify(filters)}:${JSON.stringify(pagination)}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const { q, location, currentCompany, skill, sort } = filters;
  const { page, limit } = pagination;

  const skip = (page - 1) * limit;

  // Build the dynamic WHERE clause
  const where = {
    AND: []
  };

  // 1. General search query (q) - Case insensitive & Partial match
  if (q) {
    where.AND.push({
      OR: [
        { fullName: { contains: q, mode: 'insensitive' } },
        { profile: { headline: { contains: q, mode: 'insensitive' } } },
        { skills: { some: { skill: { name: { contains: q, mode: 'insensitive' } } } } },
        { experiences: { some: { companyName: { contains: q, mode: 'insensitive' } } } }
      ]
    });
  }

  // 2. Specific Filters
  if (location) {
    where.AND.push({
      profile: { location: { contains: location, mode: 'insensitive' } }
    });
  }

  if (currentCompany) {
    where.AND.push({
      experiences: {
        some: {
          companyName: { contains: currentCompany, mode: 'insensitive' },
          isCurrent: true
        }
      }
    });
  }

  if (skill) {
    where.AND.push({
      skills: {
        some: {
          skill: { name: { contains: skill, mode: 'insensitive' } }
        }
      }
    });
  }

  // If no filters were added, remove the empty AND to prevent Prisma errors
  if (where.AND.length === 0) {
    delete where.AND;
  }

  // Define sort strategy
  const orderBy = sort === 'newest' ? { createdAt: 'desc' } : undefined;

  // Define selection to strictly protect private fields and prevent N+1
  const select = {
    id: true,
    username: true,
    fullName: true,
    createdAt: true,
    profile: {
      select: {
        headline: true,
        location: true,
        avatarUrl: true
      }
    },
    experiences: {
      where: { isCurrent: true },
      select: {
        title: true,
        companyName: true
      },
      take: 1 // Optimize by only taking the primary current experience
    },
    skills: {
      select: {
        skill: {
          select: {
            name: true
          }
        }
      },
      take: 5 // Return max 5 top skills for search results snippet
    }
  };

  // Execute concurrently for performance
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select,
      skip,
      take: limit,
      orderBy
    }),
    prisma.user.count({ where })
  ]);

  // Format response to flatten relationships nicely
  const formattedUsers = users.map(user => ({
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    headline: user.profile?.headline || null,
    location: user.profile?.location || null,
    avatarUrl: user.profile?.avatarUrl || null,
    currentExperience: user.experiences.length > 0 ? user.experiences[0] : null,
    skills: user.skills.map(s => s.skill.name),
    joinedAt: user.createdAt
  }));

  const totalPages = Math.ceil(total / limit);

  const result = {
    users: formattedUsers,
    pagination: {
      total,
      currentPage: page,
      totalPages,
      hasNextPage: Boolean(page < totalPages)
    }
  };

  await cache.set(cacheKey, result, 300); // Cache search for 5 minutes
  return result;
};
