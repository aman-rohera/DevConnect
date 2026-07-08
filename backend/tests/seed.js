import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test environment
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

import prisma from '../src/config/db.js';
import { createUser, createPost, createConnection } from './factories/factories.js';
import { cleanupDatabase } from './helpers/db-setup.js';

export const seed = async () => {
  console.log('Seeding test database...');
  await cleanupDatabase();

  // 1. Create Default Users
  const dev1 = await createUser({
    fullName: 'Developer One',
    email: 'dev1@devconnect.com',
    headline: 'Senior Frontend Architect | React & TS Specialist',
    bio: 'Building responsive user interfaces with modern React, TypeScript, and design systems.',
    skills: ['React', 'TypeScript', 'CSS', 'Vite', 'Frontend']
  });

  const dev2 = await createUser({
    fullName: 'Developer Two',
    email: 'dev2@devconnect.com',
    headline: 'Backend Lead | Node.js & Database Engineer',
    bio: 'Designing scalable microservices and relational PostgreSQL databases.',
    skills: ['Node.js', 'PostgreSQL', 'Prisma', 'Express', 'Backend']
  });

  const dev3 = await createUser({
    fullName: 'Developer Three',
    email: 'dev3@devconnect.com',
    headline: 'AI & DevOps Specialist',
    bio: 'Deploying deep learning models with Docker, Kubernetes, and cloud pipelines.',
    skills: ['Python', 'AI', 'Docker', 'Kubernetes', 'GraphQL']
  });

  const admin = await createUser({
    fullName: 'Admin User',
    email: 'admin@devconnect.com',
    headline: 'Platform Admin',
    bio: 'System administration and security controls.',
    skills: ['Docker', 'PostgreSQL', 'Management']
  });

  const guest = await createUser({
    fullName: 'Guest User',
    email: 'guest@devconnect.com',
    headline: 'Guest Developer',
    bio: 'Exploring DevConnect platform.',
    skills: ['React']
  });

  console.log(`Created 5 default users:
  - Developer One (dev1@devconnect.com)
  - Developer Two (dev2@devconnect.com)
  - Developer Three (dev3@devconnect.com)
  - Admin User (admin@devconnect.com)
  - Guest User (guest@devconnect.com)`);

  // 2. Create Realistic Connections
  // dev1 and dev2 are fully connected
  const conn1 = await createConnection(dev1.id, dev2.id, { status: 'ACCEPTED' });
  
  // dev2 and dev3 are fully connected
  const conn2 = await createConnection(dev2.id, dev3.id, { status: 'ACCEPTED' });

  // dev3 sent request to dev1 (PENDING)
  const conn3 = await createConnection(dev3.id, dev1.id, { status: 'PENDING' });

  // dev1 sent request to admin (PENDING)
  const conn4 = await createConnection(dev1.id, admin.id, { status: 'PENDING' });

  console.log('Seeded network relationships (ACCEPTED & PENDING connections).');

  // 3. Create Posts
  const topics = [
    { topic: 'React', content: 'React 19 features look extremely promising, especially the native support for Actions and document metadata updates! #reactjs #webdev' },
    { topic: 'TypeScript', content: 'TypeScript template literal types are incredibly powerful for creating type-safe styling frameworks. #typescript #frontend' },
    { topic: 'Node.js', content: 'Express.js is still the solid standard, but Fastify is gaining huge ground in high-throughput APIs. #nodejs #backend' },
    { topic: 'PostgreSQL', content: 'Database indexing is an art form. B-Trees cover 90% of use cases, but GIN indexes are lifesavers for JSON columns. #postgres #sql' },
    { topic: 'AI', content: 'Building local LLM interfaces with Ollama and LangChain in Node.js has never been easier. #ai #javascript' },
    { topic: 'Docker', content: 'Keep your Docker images clean and lightweight by using multi-stage builds and alpine bases. #devops #docker' },
    { topic: 'Next.js', content: 'Next.js App Router and Server Components changed the way we think about the network boundary. #nextjs #react' },
    { topic: 'Supabase', content: 'Leveraging Supabase Row Level Security (RLS) is key to writing secure, client-direct database queries. #supabase #backend' }
  ];

  const users = [dev1, dev2, dev3, admin, guest];
  let postCount = 0;

  for (let i = 0; i < 20; i++) {
    const topicItem = topics[i % topics.length];
    const userItem = users[i % users.length];
    await createPost(userItem.id, {
      content: `${topicItem.content} (Post variation #${i + 1})`,
      imageUrl: i % 3 === 0 ? 'https://images.unsplash.com/photo-1555066931-4365d14bab8c' : ''
    });
    postCount++;
  }

  console.log(`Generated ${postCount} realistic posts with tags.`);
  console.log('Database seeding completed successfully.');
};

// Check if running directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
