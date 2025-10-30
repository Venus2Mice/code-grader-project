/**
 * DEPRECATED: Use types from @/types/index.ts instead
 * This file is kept for backward compatibility only
 */

// Re-export all types from centralized location
export type {
  // Base types
  APIResponse,
  APIError,
  UserRole,
  Language,
  Difficulty,
  SubmissionStatus,
  
  // Auth & User
  User,
  LoginRequest,
  RegisterRequest,
  
  // Class
  Class,
  CreateClassRequest,
  
  // Problem
  Problem,
  CreateProblemRequest,
  TestCase,
  TestCaseInput,
  TestCaseOutput,
  LanguageLimit,
  LanguageLimits,
  
  // Submission
  Submission,
  SubmitCodeRequest,
  SubmissionResult,
  TestResult,
  SubmissionStats,
  
  // Student
  Student
} from './index'

// Import types for use in this file
import type { Submission, Problem, APIResponse as BaseAPIResponse } from './index'

export interface LeaderboardEntry {
  rank: number
  user_id: number
  username: string
  full_name: string
  total_score: number
  problems_solved: number
  submissions_count: number
  last_submission?: string
}

export interface ProblemStats {
  problem_id: number
  problem_title: string
  total_submissions: number
  accepted_submissions: number
  acceptance_rate: number
  average_score: number
}

// ============================================
// WebSocket Types (for real-time updates)
// ============================================

export interface WebSocketMessage {
  type: "submission_update" | "test_result" | "error"
  data: any
}

export interface SubmissionUpdate {
  submission_id: number
  status: Submission["status"]
  progress?: number
  message?: string
}

// ============================================
// Legacy Error Types (use APIError from index.ts)
// ============================================

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationErrors {
  errors: ValidationError[]
}

// ============================================
// Statistics Types
// ============================================

export interface UserStats {
  total_submissions: number
  accepted_submissions: number
  problems_solved: number
  total_score: number
  average_score: number
  submissions_by_status: Record<Submission["status"], number>
  recent_activity: Submission[]
}

export interface ClassStats {
  total_students: number
  total_problems: number
  total_submissions: number
  average_score: number
  top_students: LeaderboardEntry[]
  problem_stats: ProblemStats[]
}

// ============================================
// Type Guards
// ============================================

export function isSubmission(obj: any): obj is Submission {
  return obj && typeof obj.id === "number" && typeof obj.source_code === "string"
}

export function isProblem(obj: any): obj is Problem {
  return obj && typeof obj.id === "number" && typeof obj.title === "string" && Array.isArray(obj.test_cases)
}

// ============================================
// Utility Types
// ============================================

export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>
export type PartialFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type ExtractData<T> = T extends BaseAPIResponse<infer U> ? U : T
