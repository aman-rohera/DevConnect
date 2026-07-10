import prisma from '../../config/db.js';
import cache from '../../config/cache.js';

const getCompanyCacheKey = (companyId) => `company:${companyId}`;

const createCompany = async (data) => {
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
      slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
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

const updateCompany = async (companyId, data) => {
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

const getDepartments = async (companyId) => {
  return prisma.department.findMany({
    where: { companyId }
  });
};

export { createCompany, getCompany, updateCompany, followCompany, unfollowCompany, getDepartments };
