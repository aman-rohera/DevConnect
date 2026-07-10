import prisma from '../../config/db.js';

export const createRequest = async (userId, data) => {
  // Check if company name already exists
  const existingCompanyByName = await prisma.company.findFirst({
    where: { name: { equals: data.companyName, mode: 'insensitive' } }
  });
  if (existingCompanyByName) {
    throw new Error('A company with this name already exists');
  }

  // Check if slug already exists in companies
  const existingCompanyBySlug = await prisma.company.findUnique({
    where: { slug: data.slug }
  });
  if (existingCompanyBySlug) {
    throw new Error('A company with this slug already exists');
  }

  // Check if there is an existing pending request for this slug or name
  const existingRequest = await prisma.companyCreationRequest.findFirst({
    where: {
      status: 'PENDING',
      OR: [
        { slug: data.slug },
        { companyName: { equals: data.companyName, mode: 'insensitive' } }
      ]
    }
  });
  if (existingRequest) {
    throw new Error('A pending request for this company name or slug already exists');
  }
  
  // Check if the user already has a pending request
  const userPendingRequest = await prisma.companyCreationRequest.findFirst({
    where: {
      requesterId: userId,
      status: 'PENDING'
    }
  });
  if (userPendingRequest) {
    throw new Error('You already have a pending company creation request');
  }

  const request = await prisma.companyCreationRequest.create({
    data: {
      requesterId: userId,
      companyName: data.companyName,
      slug: data.slug,
      website: data.website || null,
      industry: data.industry || null,
      size: data.size || null,
      headquarters: data.headquarters || null,
      description: data.description || null,
      logoUrl: data.logoUrl || null,
      coverUrl: data.coverUrl || null,
      status: 'PENDING'
    }
  });

  return request;
};

export const getUserRequests = async (userId) => {
  return prisma.companyCreationRequest.findMany({
    where: { requesterId: userId },
    orderBy: { createdAt: 'desc' }
  });
};
