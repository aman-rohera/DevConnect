# DevConnect 🚀

DevConnect is a premium, developer-first professional networking platform. It features a modern, responsive **Dark Blue & Slate-purple glassmorphic theme** designed to look highly professional, visual, and clean.

---

## 🌟 Core Features Implemented

### 1. Modern Glassmorphic UI/UX
- Premium Slate-dark theme (`#0f172a` / `#131e35`) with indigo and emerald glowing accents.
- Responsive grids, glass panels with backdrop filters, and hover micro-animations.

### 2. Secure Authentication System
- Token-based **JWT Authentication** flow with Express.js backend.
- Protected client-side routes using React Context (`AuthContext`).
- Fully functional Sign Up, Login, and Password Reset screens.
- Session persistence (`dc_token` in local storage) with instant global state syncing.

### 3. Developer Profile
- **Cover Banner**: Indigo-to-slate gradient backdrop that supports visual customization.
- **Overlapping Avatar**: Interactive profile avatar centered and overlapping the banner.
- **Professional Metadata**: Full Name, Location, Professional Headline, and quick metric indicators (Profile Views & Impressions).
- **About Section**: Multi-line bio card displaying background interests.
- **Skills Showcase**: Inter-active tag chip manager (Fira Code font) supporting live tag addition and deletion.
- **Education Timeline**: Dynamic timeline listing schools, degrees, and study years.
- **Experience Timeline**: Dynamic timeline displaying companies, titles, descriptions, and durations.
- **Certificates list**: Visual cards showing certificate name, issuer, issue date, and link.
- **Featured Projects**: Responsive cards showing project titles, descriptions, repository links, and live demo URLs.
- **Sidebar Module**: Interactive "Other Members Viewed" sidebar. Clicking "Connect" dynamically updates connection status (Connect ➔ Pending... ➔ Connected).

### 4. Cloudinary Image Upload
- Direct local image uploading by clicking on the avatar photo in Edit Mode.
- Implemented **Axios-based direct uploads** to Cloudinary API.
- Loading spinner and dark overlay visual feedback during file upload.
- Automated URL persistence in PostgreSQL database.

### 5. Smart Recommendations & Network
- **Skill-Based Recommendations**: Recommends developers dynamically based on overlapping/shared skills.
- **People You May Know**: Suggestions for networking based on shared developer profiles and activities.
- **Common Connections**: Discover mutual network connections and interactions between members.
- **Interactive Connections**: Send, accept, or ignore connection requests to build a professional developer network.

---

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| **Frontend** | React (Vite, TypeScript), CSS, Lucide Icons |
| **Backend** | Node.js, Express.js (ES Modules) |
| **Database** | PostgreSQL (Supabase Hosting) |
| **ORM** | Prisma ORM |
| **File Storage** | Cloudinary API |

---

## 🚀 Setup & Installation

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Setup the `.env` file with your `DATABASE_URL`, `DIRECT_URL`, and `JWT_SECRET`.
4. Apply Prisma migrations to PostgreSQL:
   ```bash
   npx prisma db push
   ```
5. Start development server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file inside the `frontend` folder:
   ```env
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
   VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
   ```
4. Start Vite development server:
   ```bash
   npm run dev
   ```
