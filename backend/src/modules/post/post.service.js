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
  // Fetch the latest 50 posts with counts and check if current user liked it
  const posts = await prisma.post.findMany({
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
      media: true,
      likes: currentUserId ? {
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

  return posts.map(post => {
    const liked = currentUserId ? post.likes.length > 0 : false;
    const { likes, _count, ...rest } = post;
    return {
      ...rest,
      liked,
      likes: _count.likes,
      comments: _count.comments,
      shares: _count.shares
    };
  });
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
  await prisma.share.create({
    data: { postId, userId }
  });

  const count = await prisma.share.count({
    where: { postId }
  });

  return { sharesCount: count };
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

export {
  createPost,
  getFeedPosts,
  togglePostLike,
  logPostShare,
  addComment,
  getPostCommentsTree,
  deletePost
};
