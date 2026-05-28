-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    headline VARCHAR(255) DEFAULT '',
    bio TEXT DEFAULT '',
    avatar_url VARCHAR(255) DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. SKILLS MASTER TABLE
CREATE TABLE IF NOT EXISTS skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- 3. USER_SKILLS JUNCTION TABLE (Many-to-Many)
CREATE TABLE IF NOT EXISTS user_skills (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    skill_id INT REFERENCES skills(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, skill_id)
);

-- 4. PROJECTS TABLE (One-to-Many)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    project_url VARCHAR(255) DEFAULT '',
    repo_url VARCHAR(255) DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- 6. POPULATE INITIAL SKILLS (Optional lookup helpers)
INSERT INTO skills (name) VALUES 
('JavaScript'), ('TypeScript'), ('Python'), ('Java'), ('C++'), ('Go'), ('Rust'),
('HTML5'), ('CSS3'), ('React.js'), ('Vue.js'), ('Angular'), ('Next.js'),
('Node.js'), ('Express.js'), ('Django'), ('FastAPI'), ('Spring Boot'),
('PostgreSQL'), ('MySQL'), ('MongoDB'), ('Redis'), ('Docker'), ('Kubernetes'),
('AWS'), ('Git'), ('GraphQL'), ('REST API')
ON CONFLICT (name) DO NOTHING;
