export interface ProjectItem {
  id?: string;
  title: string;
  description: string;
  projectUrl?: string;
  repoUrl?: string;
}

export interface ExperienceItem {
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

export interface EducationItem {
  school: string;
  degree: string;
  startYear: string;
  endYear?: string;
}

export interface CertificateItem {
  name: string;
  issuer: string;
  issueDate?: string;
  link?: string;
}

export interface Profile {
  id: string;
  full_name: string;
  headline: string;
  skills: string[];
  bio?: string;
  github_url?: string;
  avatar_url?: string;
  resumeUrl?: string;
  updated_at: string;
  projects?: ProjectItem[];
  experience?: ExperienceItem[];
  education?: EducationItem[];
  certificates?: CertificateItem[];
}

export interface User {
  id: string;
  username?: string;
  email: string;
  fullName: string;
  headline?: string;
  avatarUrl?: string;
  resumeUrl?: string;
  role?: string;
  profile?: Profile | null;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
