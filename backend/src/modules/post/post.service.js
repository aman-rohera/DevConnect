import prisma from '../../config/db.js';
import cache from '../../config/cache.js';

const createPost = async (userId, content, imageUrl = null) => {
  const result = await prisma.post.create({
    data: {
      userId,
      content,
      imageUrl
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          fullName: true,
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

  await cache.flushPattern('posts:feed:*');
  return result;
};

const getFeedPosts = async (currentUserId = null) => {
  const cacheKey = `posts:feed:${currentUserId || 'public'}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  // 1. Fetch original posts
  const posts = await prisma.post.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    take: 50,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          fullName: true,
          profile: {
            select: {
              headline: true,
              avatarUrl: true
            }
          }
        }
      },
      media: true,
      likes: currentUserId ? {
        where: { userId: currentUserId }
      } : false,
      shares: currentUserId ? {
        where: { userId: currentUserId }
      } : false,
      _count: {
        select: {
          likes: true,
          comments: true,
          shares: true
        }
      }
    }
  });

  const originalItems = posts.map(post => {
    const liked = currentUserId ? post.likes.length > 0 : false;
    const shared = currentUserId ? post.shares.length > 0 : false;
    const { likes, shares, _count, ...rest } = post;
    return {
      ...rest,
      liked,
      shared,
      likes: _count.likes,
      comments: _count.comments,
      shares: _count.shares,
      feedTime: post.createdAt
    };
  });

  // 2. Fetch shared/reposted posts
  const shares = await prisma.share.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    take: 50,
    include: {
      user: {
        select: {
          id: true,
          fullName: true
        }
      },
      post: {
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
          media: true,
          likes: currentUserId ? {
            where: { userId: currentUserId }
          } : false,
          shares: currentUserId ? {
            where: { userId: currentUserId }
          } : false,
          _count: {
            select: {
              likes: true,
              comments: true,
              shares: true
            }
          }
        }
      }
    }
  });

  const sharedItems = shares.map(s => {
    const post = s.post;
    const liked = currentUserId ? post.likes.length > 0 : false;
    const shared = currentUserId ? post.shares.length > 0 : false;
    const { likes, shares: sharesRel, _count, ...rest } = post;
    return {
      ...rest,
      liked,
      shared,
      likes: _count.likes,
      comments: _count.comments,
      shares: _count.shares,
      repostedBy: {
        id: s.user.id,
        fullName: s.user.fullName
      },
      feedTime: s.createdAt
    };
  });

  // Combine and sort by feedTime desc
  const combined = [...originalItems, ...sharedItems].sort((a, b) => {
    return new Date(b.feedTime).getTime() - new Date(a.feedTime).getTime();
  });

  const finalFeed = combined.slice(0, 50);
  await cache.set(cacheKey, finalFeed, 300); // 5 mins
  return finalFeed;
};

const togglePostLike = async (userId, postId) => {
  const existing = await prisma.like.findUnique({
    where: {
      postId_userId: { postId, userId }
    }
  });

  if (existing) {
    try {
      await prisma.like.delete({
        where: {
          postId_userId: { postId, userId }
        }
      });
    } catch (e) {
      // Ignore P2025 if already deleted by a concurrent request
    }
  } else {
    try {
      await prisma.like.create({
        data: { postId, userId }
      });
    } catch (e) {
      // Ignore P2002 if already created by a concurrent request
    }
  }

  const count = await prisma.like.count({
    where: { postId }
  });

  await cache.flushPattern('posts:feed:*');
  await cache.flushPattern(`post:${postId}:*`);

  return { liked: !existing, likesCount: count };
};

const logPostShare = async (userId, postId) => {
  const existing = await prisma.share.findFirst({
    where: { postId, userId }
  });

  if (existing) {
    try {
      await prisma.share.delete({
        where: { id: existing.id }
      });
    } catch (e) {
      // Ignore P2025
    }
  } else {
    try {
      await prisma.share.create({
        data: { postId, userId }
      });
    } catch (e) {
      // Ignore P2002
    }
  }

  const count = await prisma.share.count({
    where: { postId }
  });

  await cache.flushPattern('posts:feed:*');
  await cache.flushPattern(`post:${postId}:*`);

  return { shared: !existing, sharesCount: count };
};

const addComment = async (userId, postId, content, parentCommentId = null) => {
  const result = await prisma.comment.create({
    data: {
      userId,
      postId,
      content,
      parentCommentId
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
      }
    }
  });

  await cache.del(`post:comments:${postId}`);
  await cache.flushPattern(`post:${postId}:*`);
  await cache.flushPattern('posts:feed:*');

  return result;
};

const getPostCommentsTree = async (postId) => {
  const cacheKey = `post:comments:${postId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const flatComments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: 'asc' },
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
      }
    }
  });

  // Build root and nested replies hierarchy
  const map = {};
  flatComments.forEach(comment => {
    map[comment.id] = { ...comment, replies: [] };
  });

  const roots = [];
  flatComments.forEach(comment => {
    const mapped = map[comment.id];
    if (comment.parentCommentId) {
      const parent = map[comment.parentCommentId];
      if (parent) {
        parent.replies.push(mapped);
      } else {
        roots.push(mapped);
      }
    } else {
      roots.push(mapped);
    }
  });

  await cache.set(cacheKey, roots, 300);
  return roots;
};

const deletePost = async (userId, postId) => {
  const post = await prisma.post.findUnique({
    where: { id: postId }
  });

  if (!post) {
    throw new Error('Post not found');
  }

  if (post.userId !== userId) {
    throw new Error('Unauthorized to delete this post');
  }

  const result = await prisma.post.delete({
    where: { id: postId }
  });

  await cache.flushPattern('posts:feed:*');
  await cache.flushPattern(`post:${postId}:*`);
  await cache.del(`post:comments:${postId}`);

  return result;
};

const getPostReposters = async (postId) => {
  const shares = await prisma.share.findMany({
    where: { postId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          profile: {
            select: {
              avatarUrl: true,
              headline: true
            }
          }
        }
      }
    }
  });

  return shares.map(s => ({
    id: s.user.id,
    fullName: s.user.fullName,
    username: s.user.fullName.toLowerCase().replace(/\s+/g, ""),
    avatarUrl: s.user.profile?.avatarUrl || null,
    headline: s.user.profile?.headline || 'Developer',
    repostedAt: s.createdAt
  }));
};

const getPostById = async (postId, currentUserId = null) => {
  const cacheKey = `post:${postId}:user:${currentUserId || 'public'}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const post = await prisma.post.findUnique({
    where: { id: postId },
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
      media: true,
      likes: currentUserId ? {
        where: { userId: currentUserId }
      } : false,
      shares: currentUserId ? {
        where: { userId: currentUserId }
      } : false,
      _count: {
        select: {
          likes: true,
          comments: true,
          shares: true
        }
      }
    }
  });

  if (!post) {
    throw new Error('Post not found');
  }

  const liked = currentUserId ? (post.likes && post.likes.length > 0) : false;
  const shared = currentUserId ? (post.shares && post.shares.length > 0) : false;
  const { likes, shares, _count, ...rest } = post;

  const result = {
    ...rest,
    liked,
    shared,
    likes: _count.likes,
    comments: _count.comments,
    shares: _count.shares
  };

  await cache.set(cacheKey, result, 300);
  return result;
};

export {
  createPost,
  getFeedPosts,
  getPostById,
  togglePostLike,
  logPostShare,
  addComment,
  getPostCommentsTree,
  deletePost,
  getPostReposters
};
