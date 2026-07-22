import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
});

async function main() {
  await client.connect();
  console.log('Dropping schema test cascade...');
  await client.query('DROP SCHEMA IF EXISTS "test" CASCADE;');
  await client.query('CREATE SCHEMA "test";');
  console.log('Schema test recreated successfully.');
  await client.end();
}

main().catch(err => {
  console.error('Error cleaning test db:', err);
  process.exit(1);
});
