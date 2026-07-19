import prisma from '../../config/db.js';
import cache from '../../config/cache.js';

const getJobsCacheKey = (filters) => `jobs:query:${JSON.stringify(filters)}`;

const createJob = async (recruiterId, data) => {
  // First, find the recruiter's company relation
  const recruiter = await prisma.recruiter.findUnique({
    where: { userId: recruiterId }
  });

  if (!recruiter) {
    throw new Error('Only registered recruiters can post jobs');
  }

  // Ensure that if a companyId is specified in the body, it matches the recruiter's company
  if (data.companyId && data.companyId !== recruiter.companyId) {
    throw new Error('Unauthorized: You can only post jobs for your registered company');
  }

  const job = await prisma.job.create({
    data: {
      companyId: recruiter.companyId,
      recruiterId: recruiter.id,
      title: data.title,
      description: data.description,
      location: data.location,
      type: data.type || 'FULL_TIME',
      employmentType: data.employmentType || 'ON_SITE',
      isClosed: false
    }
  });

  // Handle skill requirements if provided
  if (data.skills && Array.isArray(data.skills)) {
    for (const skillId of data.skills) {
      await prisma.jobSkill.create({
        data: {
          jobId: job.id,
          skillId: skillId
        }
      });
    }
  }

  // Flush jobs cache on new job creation
  cache.flush(); // Simple invalidation strategy: flush jobs cache
  
  return job;
};

const getJobs = async (filters = {}) => {
  const cacheKey = getJobsCacheKey(filters);
  const cached = cache.get(cacheKey);

  if (cached) {
    console.log('[Cache Hit] Job Listings Feed');
    return cached;
  }

  console.log('[Cache Miss] Job Listings Feed');
  const where = {};
  if (filters.location) {
    where.location = { contains: filters.location, mode: 'insensitive' };
  }
  if (filters.type) {
    where.type = filters.type;
  }
  if (filters.employmentType) {
    where.employmentType = filters.employmentType;
  }

  const jobs = await prisma.job.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      company: {
        select: {
          name: true,
          logoUrl: true,
          industry: true
        }
      },
      skills: {
        include: {
          skill: true
        }
      }
    }
  });

  cache.set(cacheKey, jobs, 60); // Cache search query results for 1 minute
  return jobs;
};

const saveJob = async (userId, jobId) => {
  return prisma.savedJob.create({
    data: {
      userId,
      jobId
    }
  });
};

const getSavedJobs = async (userId) => {
  return prisma.savedJob.findMany({
    where: { userId },
    include: {
      job: {
        include: {
          company: true
        }
      }
    }
  });
};

const applyToJob = async (userId, jobId, resumeUrl) => {
  return prisma.application.create({
    data: {
      userId,
      jobId,
      resumeUrl,
      status: 'PENDING'
    }
  });
};

const getApplications = async (jobId, userId) => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { recruiter: true }
  });

  if (!job) {
    throw new Error('Job not found');
  }

  // Check if requesting user is the recruiter who posted it
  const isPoster = job.recruiter.userId === userId;

  // Check if requesting user is a company owner or admin
  const member = await prisma.companyMember.findUnique({
    where: {
      companyId_userId: {
        companyId: job.companyId,
        userId
      }
    }
  });

  const isAuthorized = isPoster || (member && (member.role === 'OWNER' || member.role === 'ADMIN'));

  if (!isAuthorized) {
    throw new Error('Unauthorized: Only company recruiters, owners, or admins can view applications');
  }

  const list = await prisma.application.findMany({
    where: { jobId },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profile: {
            select: {
              headline: true,
              avatarUrl: true
            }
          }
        }
      }
    }
  });

  return list.map(app => ({
    ...app,
    user: {
      id: app.user.id,
      fullName: app.user.fullName,
      email: app.user.email,
      headline: app.user.profile?.headline || null,
      avatarUrl: app.user.profile?.avatarUrl || null
    }
  }));
};

const getUserApplications = async (userId) => {
  return prisma.application.findMany({
    where: { userId },
    include: {
      job: {
        include: {
          company: true
        }
      }
    }
  });
};

export { 
  createJob, 
  getJobs, 
  saveJob, 
  getSavedJobs, 
  applyToJob, 
  getApplications, 
  getUserApplications 
};
