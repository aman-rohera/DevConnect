# DevConnect Testing Infrastructure 🚀

Welcome to the automated testing documentation for the DevConnect project. This document guides you through setting up, running, and writing automated tests for the DevConnect backend APIs.

---

## 🛠️ Testing Stack

The testing environment utilizes the following modern tooling:
- **Vitest**: An extremely fast, modern test runner native to ES Modules.
- **Supertest**: For programmatic HTTP requests and API assertions.
- **Faker.js**: For realistic test data generation (names, emails, descriptions, timelines).
- **Prisma Client**: To manage state isolation and query validations.
- **Cross-Env**: To set the test environment (`NODE_ENV=test`) uniformly across Windows, macOS, and Linux.
- **V8 Coverage**: For comprehensive coverage analysis of files and API handlers.

---

## 📂 Folder Structure

All test resources are located inside the `backend/tests` directory:

```text
backend/tests/
├── api/                             # Endpoints integration test suites
│   ├── auth/                        # Signup, login, and token protection tests
│   │   └── auth.test.js
│   ├── profile/                     # Profile fetching, editing, and timeline tests
│   │   └── profile.test.js
│   ├── posts/                       # Post creation and feed chronological checks
│   │   └── posts.test.js
│   ├── users/                       # Connections list and connection requests flow
│   │   └── users.test.js
│   └── notifications/               # Placeholder skipped notifications tests
│       └── notifications.test.js
├── factories/                       # Reusable mock factories
│   └── factories.js                 # Factory creators for users, posts, and connections
├── helpers/                         # Test utility helpers
│   ├── db-setup.js                  # Database truncate/cascading cleanup functions
│   ├── performance-reporter.js      # Custom Vitest reporter tracking durations (>300ms)
│   └── test-auth.js                 # Fast JWT signing functions for mock users
├── clean.js                         # Database cleanup command-line utility
├── seed.js                          # Database seeding command-line utility
├── setup.js                         # Global setup hooks loaded before test runners
└── vitest.config.js                 # Global Vitest configuration file
```

---

## 🚀 Setup & Execution

### 1. Configure the Test Database
To avoid touching production data, the test suite runs on an isolated database environment.
Create the `backend/.env.test` file and point the connection strings to a **dedicated test database**:

```env
PORT=5001
DATABASE_URL="postgresql://postgres.your_id:Password@aws-node-pooler.supabase.com:5432/postgres_test?schema=test"
DIRECT_URL="postgresql://postgres.your_id:Password@aws-node-pooler.supabase.com:5432/postgres_test?schema=test"
JWT_SECRET=test_jwt_secret_token_84f95346537dd5e7896755df1216edb718852886271b6c
NODE_ENV=test

NEO4J_URI=neo4j+s://0f032c09.databases.neo4j.io
NEO4J_USERNAME=0f032c09
NEO4J_PASSWORD=your_neo4j_test_password
```

> [!CAUTION]
> Running tests will automatically truncate (delete all records) in the database specified in `.env.test`. Do **NOT** point these variables to your production database.

### 2. Run the Full Test Suite
To initialize packages and run all tests, simply execute the following in the project root:

```bash
# Install root and backend dependencies
npm install

# Run the complete test suite
npm test
```
The test runner will:
1. Automatically load `.env.test`.
2. Sync the Prisma schema to the test database (`prisma db push`) using the `pretest` hook.
3. Clean the tables before each test file.
4. Run all authentication, profile, posts, connections, validation, and security test files.
5. Log a **Performance Warning** for any test that exceeds `300ms`.
6. Print a summary of any failed API calls.

---

## ⚙️ NPM Scripts Reference

You can execute specific test scopes from the project root:

| Command | Action |
|---|---|
| `npm test` | Runs the full test suite once |
| `npm run test:watch` | Runs tests in interactive watch mode |
| `npm run test:coverage` | Generates a coverage report in the `backend/coverage` folder |
| `npm run test:api` | Runs API endpoint tests |
| `npm run test:auth` | Runs login and signup validation tests |
| `npm run test:profile` | Runs profile and timeline update tests |
| `npm run test:posts` | Runs post creation and feed tests |
| `npm run test:users` | Runs connections and user profile timeline tests |
| `npm run test:seed` | Manually populates the test database with 5 mock users and 20 sample posts |
| `npm run test:clean` | Manually truncates all data inside the test database |

---

## 💡 How it Works Under the Hood

### Database Isolation & Truncations
To keep tests fast and independent, the global test hook `backend/tests/setup.js` executes a database truncation using raw PostgreSQL cascade commands before each test:

```javascript
import prisma from '../../src/config/db.js';

export const cleanupDatabase = async () => {
  const tables = ['user_skills', 'skills', 'projects', 'connections', 'posts', 'users'];
  for (const table of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
  }
};
```
This isolates each test execution cleanly without the overhead of dropping and recreating tables.

### Reusable Factories
Use the factory helpers defined in `backend/tests/factories/factories.js` to build or insert mock data in your test suites:

```javascript
import { createUser, createPost } from '../../factories/factories.js';

// Creates a user with random details and returns them (with plaintext password)
const user = await createUser({
  fullName: 'Custom Developer',
  skills: ['React', 'Docker']
});

// Creates a post for the specified user
const post = await createPost(user.id, {
  content: 'Hello World!'
});
```

### Performance Monitoring
The custom Vitest reporter `backend/tests/helpers/performance-reporter.js` tracks the duration of all API requests. If a request duration exceeds `300ms`, a performance warning will be printed in the console logs during test suite completion.
