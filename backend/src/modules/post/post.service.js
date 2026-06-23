import prisma from '../../config/db.js';

export const createPost = async (userId, content, imageUrl) => {
  return prisma.post.create({
    data: {
      userId,
      content,
      imageUrl
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          headline: true,
          avatarUrl: true
        }
      }
    }
  });
};

export const getFeedPosts = async () => {
  // Simple feed: fetch the latest 50 posts
  return prisma.post.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    take: 50,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          headline: true,
          avatarUrl: true
        }
      }
    }
  });
};
