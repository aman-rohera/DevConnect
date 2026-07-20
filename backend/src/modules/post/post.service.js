import prisma from '../../config/db.js';

const createPost = async (userId, content, imageUrl = null) => {
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
};

const getFeedPosts = async (currentUserId = null) => {
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

  return combined.slice(0, 50);
};

const togglePostLike = async (userId, postId) => {
  const existing = await prisma.like.findUnique({
    where: {
      postId_userId: { postId, userId }
    }
  });

  if (existing) {
    await prisma.like.delete({
      where: {
        postId_userId: { postId, userId }
      }
    });
  } else {
    await prisma.like.create({
      data: { postId, userId }
    });
  }

  const count = await prisma.like.count({
    where: { postId }
  });

  return { liked: !existing, likesCount: count };
};

const logPostShare = async (userId, postId) => {
  const existing = await prisma.share.findFirst({
    where: { postId, userId }
  });

  if (existing) {
    await prisma.share.delete({
      where: { id: existing.id }
    });
  } else {
    await prisma.share.create({
      data: { postId, userId }
    });
  }

  const count = await prisma.share.count({
    where: { postId }
  });

  return { shared: !existing, sharesCount: count };
};

const addComment = async (userId, postId, content, parentCommentId = null) => {
  return prisma.comment.create({
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
};

const getPostCommentsTree = async (postId) => {
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

  return prisma.post.delete({
    where: { id: postId }
  });
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

  return {
    ...rest,
    liked,
    shared,
    likes: _count.likes,
    comments: _count.comments,
    shares: _count.shares
  };
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
