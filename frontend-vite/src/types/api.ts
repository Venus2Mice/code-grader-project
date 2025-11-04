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

