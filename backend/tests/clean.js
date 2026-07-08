import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test environment
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

import { cleanupDatabase } from './helpers/db-setup.js';
import prisma from '../src/config/db.js';

export const clean = async () => {
  console.log('Cleaning test database...');
  await cleanupDatabase();
  await prisma.$disconnect();
  console.log('Database cleanup completed.');
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  clean()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
