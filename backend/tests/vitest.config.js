import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

export default defineConfig({
  ssr: {
    external: ['nodemailer']
  },
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 45000,
    hookTimeout: 45000,
    fileParallelism: false,
    maxWorkers: 1,
    server: {
      deps: {
        external: ['nodemailer']
      }
    },
    poolOptions: {
      threads: {
        singleThread: true
      }
    },
    include: ['tests/**/*.test.js'],
    setupFiles: [path.resolve(__dirname, './setup.js')],
    reporters: ['default', path.resolve(__dirname, './helpers/performance-reporter.js')],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      reportsDirectory: path.resolve(__dirname, '../coverage'),
      exclude: [
        'node_modules/**',
        'tests/**',
        'prisma/**',
        'server.js',
        'src/config/**'
      ]
    }
  }
});
