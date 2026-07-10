import prisma from '../../config/db.js';

export const getDashboardStats = async () => {
  const [
    totalUsers,
    totalCompanies,
    pendingRequests,
    totalJobs,
    totalApplications,
    activeRecruiters,
    totalPosts
  ] = await Promise.all([
    prisma.user.count(),
    prisma.company.count(),
    prisma.companyCreationRequest.count({ where: { status: 'PENDING' } }),
    prisma.job.count(),
    prisma.application.count(),
    prisma.recruiter.count(),
    prisma.post.count()
  ]);

  return {
    totalUsers,
    totalCompanies,
    pendingRequests,
    totalJobs,
    totalApplications,
    activeRecruiters,
    totalPosts
  };
};

export const getUsers = async ({ skip, take, search }) => {
  const where = search ? {
    OR: [
      { fullName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ]
  } : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, email: true, fullName: true, role: true, isSuspended: true, createdAt: true
      }
    }),
    prisma.user.count({ where })
  ]);
  return { users, total };
};

export const getUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
    include: { profile: true }
  });
};

export const updateUser = async (id, data, adminId) => {
  const user = await prisma.user.update({
    where: { id },
    data
  });
  
  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: 'USER_UPDATED',
      details: `Updated user ${id}: ${JSON.stringify(data)}`
    }
  });
  
  return user;
};

export const deleteUser = async (id, adminId) => {
  await prisma.user.delete({ where: { id } });
  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: 'USER_DELETED',
      details: `Deleted user ${id}`
    }
  });
};

export const getCompanyRequests = async ({ skip, take, status }) => {
  const where = status ? { status } : {};
  const [requests, total] = await Promise.all([
    prisma.companyCreationRequest.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        requester: { select: { id: true, fullName: true, email: true } }
      }
    }),
    prisma.companyCreationRequest.count({ where })
  ]);
  return { requests, total };
};

export const getCompanyRequestById = async (id) => {
  return prisma.companyCreationRequest.findUnique({
    where: { id },
    include: {
      requester: { select: { id: true, fullName: true, email: true } }
    }
  });
};

export const approveCompanyRequest = async (id, adminId) => {
  return await prisma.$transaction(async (tx) => {
    const request = await tx.companyCreationRequest.findUnique({ where: { id } });
    if (!request) throw new Error('Request not found');
    if (request.status !== 'PENDING') throw new Error('Request is not pending');

    const updatedRequest = await tx.companyCreationRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedById: adminId,
        reviewedAt: new Date()
      }
    });

    const company = await tx.company.create({
      data: {
        name: request.companyName,
        slug: request.slug,
        website: request.website,
        industry: request.industry,
        employeeCount: request.size,
        description: request.description,
        logoUrl: request.logoUrl,
        isVerified: true
      }
    });

    await tx.companyMember.create({
      data: {
        companyId: company.id,
        userId: request.requesterId,
        role: 'OWNER'
      }
    });

    await tx.auditLog.create({
      data: {
        userId: adminId,
        action: 'COMPANY_APPROVED',
        details: `Approved company request ${id} and created company ${company.id}`
      }
    });

    return { request: updatedRequest, company };
  });
};

export const rejectCompanyRequest = async (id, reason, adminId) => {
  return await prisma.$transaction(async (tx) => {
    const request = await tx.companyCreationRequest.findUnique({ where: { id } });
    if (!request) throw new Error('Request not found');
    if (request.status !== 'PENDING') throw new Error('Request is not pending');

    const updatedRequest = await tx.companyCreationRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        reviewedById: adminId,
        reviewedAt: new Date()
      }
    });

    await tx.auditLog.create({
      data: {
        userId: adminId,
        action: 'COMPANY_REJECTED',
        details: `Rejected company request ${id}. Reason: ${reason}`
      }
    });

    return updatedRequest;
  });
};

export const getCompanies = async ({ skip, take, search }) => {
  const where = search ? { name: { contains: search, mode: 'insensitive' } } : {};
  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where, skip, take, orderBy: { createdAt: 'desc' }
    }),
    prisma.company.count({ where })
  ]);
  return { companies, total };
};

export const getCompanyById = async (id) => {
  return prisma.company.findUnique({ where: { id } });
};

export const updateCompanyStatus = async (id, isSuspended, adminId) => {
  const company = await prisma.company.update({
    where: { id },
    data: { isSuspended }
  });
  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: isSuspended ? 'COMPANY_SUSPENDED' : 'COMPANY_ACTIVATED',
      details: `${isSuspended ? 'Suspended' : 'Activated'} company ${id}`
    }
  });
  return company;
};

export const deleteCompany = async (id, adminId) => {
  await prisma.company.delete({ where: { id } });
  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: 'COMPANY_DELETED',
      details: `Deleted company ${id}`
    }
  });
};

export const getJobs = async ({ skip, take }) => {
  const [jobs, total] = await Promise.all([
    prisma.job.findMany({ skip, take, orderBy: { createdAt: 'desc' }, include: { company: { select: { name: true } } } }),
    prisma.job.count()
  ]);
  return { jobs, total };
};

export const updateJobStatus = async (id, isSuspended, adminId) => {
  const job = await prisma.job.update({
    where: { id },
    data: { isSuspended }
  });
  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: isSuspended ? 'JOB_SUSPENDED' : 'JOB_ACTIVATED',
      details: `${isSuspended ? 'Suspended' : 'Activated'} job ${id}`
    }
  });
  return job;
};

export const deleteJob = async (id, adminId) => {
  await prisma.job.delete({ where: { id } });
  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: 'JOB_DELETED',
      details: `Deleted job ${id}`
    }
  });
};

export const getPosts = async ({ skip, take }) => {
  const [posts, total] = await Promise.all([
    prisma.post.findMany({ skip, take, orderBy: { createdAt: 'desc' }, include: { user: { select: { fullName: true } } } }),
    prisma.post.count()
  ]);
  return { posts, total };
};

export const deletePost = async (id, adminId) => {
  await prisma.post.delete({ where: { id } });
  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: 'POST_DELETED',
      details: `Deleted post ${id}`
    }
  });
};

export const getReports = async ({ skip, take, status }) => {
  const where = status ? { status } : {};
  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where, skip, take, orderBy: { createdAt: 'desc' }, include: { reporter: { select: { fullName: true, email: true } } }
    }),
    prisma.report.count({ where })
  ]);
  return { reports, total };
};

export const getReportById = async (id) => {
  return prisma.report.findUnique({
    where: { id },
    include: { reporter: { select: { fullName: true, email: true } } }
  });
};

export const resolveReport = async (id, adminId) => {
  const report = await prisma.report.update({
    where: { id },
    data: { status: 'RESOLVED' }
  });
  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: 'REPORT_RESOLVED',
      details: `Resolved report ${id}`
    }
  });
  return report;
};

export const rejectReport = async (id, adminId) => {
  const report = await prisma.report.update({
    where: { id },
    data: { status: 'DISMISSED' }
  });
  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: 'REPORT_REJECTED',
      details: `Dismissed report ${id}`
    }
  });
  return report;
};
