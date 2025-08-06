/**
 * Types TypeScript pour l'application CV Genius
 */

// Types pour useAuthForm hook returns
export type UseAuthFormReturn = {
  email: string;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  error: string;
  loading: boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  showToast: boolean;
  setShowToast: React.Dispatch<React.SetStateAction<boolean>>;
};

// Types utilisateur
export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

// Types pour le CV
export interface Resume {
  id: string
  user_id: string
  title: string
  raw_content: CVFormData
  generated_content?: CVFormData
  status: 'draft' | 'generated' | 'published'
  created_at: string
  updated_at: string
}

export interface PersonalInfo {
  name: string
  email: string
  phone?: string
  location?: string
  linkedin?: string
  website?: string
}

export interface Experience {
  id: string
  company: string
  position: string
  location?: string
  startDate: string
  endDate?: string // null si poste actuel
  description: string
  isCurrentPosition?: boolean
}

export interface Education {
  id: string
  institution: string
  degree: string
  field?: string
  startDate: string
  endDate?: string
  description?: string
}

export interface Skill {
  id: string
  name: string
  category: 'technical' | 'soft' | 'language' | 'other'
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
}

export interface Language {
  id: string
  name: string
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'native'
}

// Types pour l'API Gemini
export interface GeminiRequest {
  prompt: string
  context?: string
  maxTokens?: number
}

export interface GeminiResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface GeminiError {
  message: string
  code?: string
  details?: any
}

// Types pour les formulaires
export interface CVFormData {
  personalInfo: Partial<PersonalInfo>
  experiences: Partial<Experience>[]
  education: Partial<Education>[]
  skills: Partial<Skill>[]
  languages?: Partial<Language>[]
}

// Types pour les API routes
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// Types pour l'authentification
export interface AuthUser {
  id: string
  email: string
  role?: 'user' | 'admin'
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  confirmPassword: string
}

// Types pour les templates de CV
export interface CVTemplate {
  id: string
  name: string
  description: string
  preview: string
  category: 'modern' | 'classic' | 'creative' | 'minimal'
  isPremium: boolean
}

// Types pour les analytics
export interface AnalyticsEvent {
  event: string
  properties?: Record<string, any>
  timestamp: Date
  userId?: string
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>> 