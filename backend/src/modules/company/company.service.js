import prisma from '../../config/db.js';
import cache from '../../config/cache.js';

const getCompanyCacheKey = (companyId) => `company:${companyId}`;

const createCompany = async (userId, data) => {
  const company = await prisma.company.create({
    data: {
      name: data.name,
      tagline: data.tagline || '',
      description: data.description || '',
      website: data.website || '',
      logoUrl: data.logoUrl || '',
      industry: data.industry || '',
      employeeCount: data.employeeCount || '',
      foundedYear: data.foundedYear ? parseInt(data.foundedYear) : null,
      slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      members: {
        create: {
          userId,
          role: 'OWNER'
        }
      }
    }
  });

  // Prefill cache
  cache.set(getCompanyCacheKey(company.id), company, 300);
  return company;
};

const getCompany = async (companyId) => {
  const cacheKey = getCompanyCacheKey(companyId);
  const cached = cache.get(cacheKey);
  
  if (cached) {
    console.log(`[Cache Hit] Company Profile: ${companyId}`);
    return cached;
  }

  console.log(`[Cache Miss] Company Profile: ${companyId}`);
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      departments: true,
      _count: {
        select: {
          members: true,
          jobs: true
        }
      }
    }
  });

  if (company) {
    cache.set(cacheKey, company, 300); // Cache for 5 minutes
  }

  return company;
};

const getCompanyBySlug = async (slug) => {
  const cacheKey = `company:slug:${slug}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log(`[Cache Hit] Company Slug: ${slug}`);
    return cached;
  }

  const company = await prisma.company.findUnique({
    where: { slug },
    include: {
      departments: true,
      posts: {
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              profile: {
                select: { avatarUrl: true }
              }
            }
          }
        }
      },
      _count: {
        select: {
          members: true,
          jobs: true
        }
      }
    }
  });

  if (company) {
    cache.set(cacheKey, company, 300);
  }
  return company;
};

const updateCompany = async (companyId, userId, data) => {
  // Check if the user is a company member and is an OWNER or ADMIN
  const member = await prisma.companyMember.findUnique({
    where: {
      companyId_userId: {
        companyId,
        userId
      }
    }
  });

  if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
    throw new Error('Unauthorized: Only company owners or admins can update this company profile');
  }

  const updated = await prisma.company.update({
    where: { id: companyId },
    data: {
      name: data.name,
      tagline: data.tagline,
      description: data.description,
      website: data.website,
      logoUrl: data.logoUrl,
      industry: data.industry,
      employeeCount: data.employeeCount,
      foundedYear: data.foundedYear ? parseInt(data.foundedYear) : undefined
    }
  });

  // Invalidate cache on update
  cache.del(getCompanyCacheKey(companyId));
  cache.del(`company:slug:${updated.slug}`);
  return updated;
};

const followCompany = async (companyId, userId) => {
  return prisma.companyFollower.create({
    data: {
      companyId,
      userId
    }
  });
};

const unfollowCompany = async (companyId, userId) => {
  return prisma.companyFollower.delete({
    where: {
      companyId_userId: {
        companyId,
        userId
      }
    }
  });
};

const getMyCompanies = async (userId) => {
  const members = await prisma.companyMember.findMany({
    where: { userId, role: { in: ['OWNER', 'ADMIN'] } },
    include: { company: true }
  });
  return members.map(m => m.company);
};

const getCompanyDashboard = async (companyId, userId) => {
  const member = await prisma.companyMember.findUnique({
    where: {
      companyId_userId: {
        companyId,
        userId
      }
    }
  });

  if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
    throw new Error('Unauthorized: Only company owners or admins can view dashboard stats');
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              profile: {
                select: { avatarUrl: true }
              }
            }
          }
        }
      },
      jobs: {
        include: {
          applications: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  profile: {
                    select: { avatarUrl: true, headline: true }
                  }
                }
              }
            }
          }
        }
      },
      _count: {
        select: {
          followers: true
        }
      }
    }
  });

  const appCount = await prisma.application.count({
    where: {
      job: {
        companyId
      }
    }
  });

  return {
    ...company,
    _count: {
      ...company._count,
      applications: appCount
    }
  };
};

const inviteToCompany = async (companyId, userId, inviteEmail, role) => {
  const member = await prisma.companyMember.findUnique({
    where: {
      companyId_userId: {
        companyId,
        userId
      }
    }
  });

  if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
    throw new Error('Unauthorized: Only company owners or admins can invite new members');
  }

  const invitee = await prisma.user.findUnique({
    where: { email: inviteEmail }
  });

  if (!invitee) {
    throw new Error('User with this email is not registered on DevConnect');
  }

  return prisma.companyMember.create({
    data: {
      companyId,
      userId: invitee.id,
      role: role
    }
  });
};

export { 
  createCompany, 
  getCompany, 
  getCompanyBySlug, 
  updateCompany, 
  followCompany, 
  unfollowCompany, 
  getCompanyDashboard,
  inviteToCompany,
  getMyCompanies
};
