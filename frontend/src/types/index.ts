export interface Profile {
  id: string;
  full_name: string;
  headline: string;
  skills: string[];
  bio?: string;
  github_url?: string;
  linkedin_url?: string;
  avatar_url?: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
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
