import prisma from '../../config/db.js';

const createPost = async (userId, content, mediaUrls = []) => {
  return prisma.post.create({
    data: {
      userId,
      content,
      media: {
        create: mediaUrls.map(url => ({
          url,
          type: 'IMAGE' // Defaulting to IMAGE for now, can be updated later
        }))
      }
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          profile: {
            select: {
              headline: true,
              avatarUrl: true
            }
          }
        }
      },
      media: true
    }
  });
};

const getFeedPosts = async () => {
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
          profile: {
            select: {
              headline: true,
              avatarUrl: true
            }
          }
        }
      },
      media: true
    }
  });
};

export { createPost, getFeedPosts };
