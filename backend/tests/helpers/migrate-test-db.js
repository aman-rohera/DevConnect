import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

const runCommand = (command, args) => {
  return new Promise((resolve, reject) => {
    // Pass the loaded process.env to the spawned process
    const child = spawn(command, args, { 
      stdio: 'inherit',
      env: process.env,
      shell: true
    });
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command ${command} exited with code ${code}`));
    });
  });
};

const run = async () => {
  console.log('Pushing Prisma schema to test database...');
  await runCommand('npx', ['prisma', 'db', 'push', '--accept-data-loss']);
};

run().catch(err => {
  console.error('Test database migration failed:', err);
  process.exit(1);
});
