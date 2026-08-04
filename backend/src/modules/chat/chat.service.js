import prisma from '../../config/db.js';
import { sendToUser } from '../../config/socket.js';
import cache from '../../config/cache.js';

const createConversation = async (userId, targetUserId, title = null) => {
  // Check if a direct conversation already exists between the two users
  const existing = await prisma.conversation.findFirst({
    where: {
      isGroup: false,
      AND: [
        { members: { some: { userId } } },
        { members: { some: { userId: targetUserId } } }
      ]
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              profile: {
                select: {
                  avatarUrl: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (existing) {
    return {
      ...existing,
      members: existing.members.map(m => ({
        ...m,
        user: {
          id: m.user.id,
          fullName: m.user.fullName,
          avatarUrl: m.user.profile?.avatarUrl || null
        }
      }))
    };
  }

  // Create new conversation
  const created = await prisma.conversation.create({
    data: {
      isGroup: false,
      title,
      members: {
        create: [
          { userId },
          { userId: targetUserId }
        ]
      }
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              profile: {
                select: {
                  avatarUrl: true
                }
              }
            }
          }
        }
      }
    }
  });

  return {
    ...created,
    members: created.members.map(m => ({
      ...m,
      user: {
        id: m.user.id,
        fullName: m.user.fullName,
        avatarUrl: m.user.profile?.avatarUrl || null
      }
    }))
  };
};

const getConversations = async (userId) => {
  const list = await prisma.conversation.findMany({
    where: {
      members: {
        some: { userId }
      }
    },
    include: {
      members: {
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
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  const mappedList = [];
  for (const c of list) {
    const mappedMembers = [];
    for (const m of c.members) {
      const isOnline = !!(await cache.get(`user:online:${m.user.id}`));
      mappedMembers.push({
        ...m,
        user: {
          id: m.user.id,
          fullName: m.user.fullName,
          avatarUrl: m.user.profile?.avatarUrl || null,
          headline: m.user.profile?.headline || null,
          online: isOnline
        }
      });
    }
    mappedList.push({
      ...c,
      members: mappedMembers
    });
  }

  return mappedList;
};

const createMessage = async (conversationId, senderId, content, type = 'TEXT') => {
  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId,
      content,
      type
    },
    include: {
      sender: {
        select: {
          id: true,
          fullName: true,
          profile: {
            select: {
              avatarUrl: true
            }
          }
        }
      }
    }
  });

  // Update conversation updatedAt timestamp
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() }
  });

  // Find all other members of the conversation
  const members = await prisma.conversationMember.findMany({
    where: { conversationId }
  });

  // Push real-time message via WebSockets to other members
  const recipients = members.filter(m => m.userId !== senderId);
  const formattedMessage = {
    ...message,
    sender: {
      id: message.sender.id,
      fullName: message.sender.fullName,
      avatarUrl: message.sender.profile?.avatarUrl || null
    }
  };

  for (const recipient of recipients) {
    sendToUser(recipient.userId, 'new_message', formattedMessage);
  }

  return formattedMessage;
};

const getMessages = async (conversationId) => {
  const list = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    include: {
      sender: {
        select: {
          id: true,
          fullName: true,
          profile: {
            select: {
              avatarUrl: true
            }
          }
        }
      }
    }
  });

  return list.map(m => ({
    ...m,
    sender: {
      id: m.sender.id,
      fullName: m.sender.fullName,
      avatarUrl: m.sender.profile?.avatarUrl || null
    }
  }));
};

export { createConversation, getConversations, createMessage, getMessages };
