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
          fullName: true,
          headline: true,
          avatarUrl: true
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

  const updated = await prisma.connection.update({
    where: { id: connectionId },
    data: { status: action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED' }
  });

  if (action === 'ACCEPT') {
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
    }
  });
};

export { sendConnectionRequest, getPendingRequests, respondToRequest, getConnections };
