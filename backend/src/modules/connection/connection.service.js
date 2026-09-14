import prisma from '../../config/db.js';
import { getNeo4jSession } from '../../config/neo4j.js';

const sendConnectionRequest = async (senderId, receiverId) => {
  // Check if request already exists
  const existing = await prisma.connection.findFirst({
    where: {
      OR: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    }
  });

  if (existing) {
    return existing; // Return existing instead of throwing to be graceful
  }

  return prisma.connection.create({
    data: {
      senderId,
      receiverId,
      status: 'PENDING'
    }
  });
};

const getPendingRequests = async (userId) => {
  return prisma.connection.findMany({
    where: {
      receiverId: userId,
      status: 'PENDING'
    },
    include: {
      sender: {
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

const respondToRequest = async (connectionId, receiverId, action) => {
  const connection = await prisma.connection.findUnique({
    where: { id: connectionId }
  });

  if (!connection || connection.receiverId !== receiverId) {
    throw new Error('Connection request not found');
  }

  if (action === 'REJECT') {
    const updated = await prisma.connection.update({
      where: { id: connectionId },
      data: { status: 'REJECTED' }
    });
    return updated;
  }

  const updated = await prisma.connection.update({
    where: { id: connectionId },
    data: { status: 'ACCEPTED' }
  });

  // Create relationship in Neo4j
  const session = getNeo4jSession();
  try {
    await session.run(
      `MATCH (u1:User {id: $u1Id}), (u2:User {id: $u2Id})
       MERGE (u1)-[:CONNECTED_TO]->(u2)
       MERGE (u2)-[:CONNECTED_TO]->(u1)`,
      { u1Id: connection.senderId, u2Id: connection.receiverId }
    );
  } catch (err) {
    console.error('Failed to create neo4j connection relationship', err);
  } finally {
    await session.close();
  }

  return updated;
};

const getConnections = async (userId) => {
  return prisma.connection.findMany({
    where: {
      OR: [
        { senderId: userId },
        { receiverId: userId }
      ]
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          fullName: true,
          profile: {
            select: { headline: true, avatarUrl: true }
          }
        }
      },
      receiver: {
        select: {
          id: true,
          username: true,
          fullName: true,
          profile: {
            select: { headline: true, avatarUrl: true }
          }
        }
      }
    }
  });
};

const getMutualConnections = async (currentUserId, targetUserId) => {
  if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
    return [];
  }

  // 1. Fetch current user's accepted connections
  const myConns = await prisma.connection.findMany({
    where: {
      OR: [
        { senderId: currentUserId, status: 'ACCEPTED' },
        { receiverId: currentUserId, status: 'ACCEPTED' }
      ]
    }
  });

  const myFriends = new Set(
    myConns.map(c => (c.senderId === currentUserId ? c.receiverId : c.senderId))
  );

  if (myFriends.size === 0) return [];

  const myFriendsArr = Array.from(myFriends);

  // 2. Fetch target user's accepted connections intersecting with myFriends
  const targetConns = await prisma.connection.findMany({
    where: {
      OR: [
        { senderId: targetUserId, status: 'ACCEPTED', receiverId: { in: myFriendsArr } },
        { receiverId: targetUserId, status: 'ACCEPTED', senderId: { in: myFriendsArr } }
      ]
    },
    include: {
      sender: {
        select: {
          id: true,
          fullName: true,
          username: true,
          profile: { select: { avatarUrl: true, headline: true } }
        }
      },
      receiver: {
        select: {
          id: true,
          fullName: true,
          username: true,
          profile: { select: { avatarUrl: true, headline: true } }
        }
      }
    }
  });

  const mutuals = [];
  const seen = new Set();
  for (const c of targetConns) {
    const m = c.senderId === targetUserId ? c.receiver : c.sender;
    if (m && m.id !== currentUserId && !seen.has(m.id)) {
      seen.add(m.id);
      mutuals.push({
        id: m.id,
        fullName: m.fullName,
        username: m.username,
        avatarUrl: m.profile?.avatarUrl || '',
        headline: m.profile?.headline || 'Developer'
      });
    }
  }

  return mutuals;
};

export { sendConnectionRequest, getPendingRequests, respondToRequest, getConnections, getMutualConnections };
