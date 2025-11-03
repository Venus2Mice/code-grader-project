/**
 * Centralized Type Definitions
 * Single source of truth matching backend schemas
 */

// ============================================
// Base Types
// ============================================

export type UserRole = 'student' | 'teacher' | 'admin'
export type Language = 'cpp' | 'python' | 'java'
export type Difficulty = 'easy' | 'medium' | 'hard'

export type SubmissionStatus = 
  | 'Pending'
  | 'Running'
  | 'Accepted'
  | 'Wrong Answer'
  | 'Runtime Error'
  | 'Compile Error'
  | 'Time Limit Exceeded'
  | 'Memory Limit Exceeded'
  | 'error'  // For frontend error handling
  | 'info'   // For info messages

// ============================================
// User & Auth Types
// ============================================

export interface User {
  id: number
  full_name: string
  email: string
  role: UserRole
  created_at?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  full_name: string
  email: string
  password: string
  role: 'student' | 'teacher'
}

// ============================================
// Class Types
// ============================================

export interface Class {
  id: number
  name: string
  course_code?: string
  description?: string
  invite_code: string
  teacher_id: number
  teacher_name?: string
  created_at?: string
  student_count?: number
  problem_count?: number
  // Student-specific statistics
  problems_done?: number
  problems_todo?: number
  total_problems?: number
}

export interface CreateClassRequest {
  name: string
  course_code?: string
  description?: string
}

// ============================================
// Problem Types (Function-Based Only)
// ============================================

// Input parameter for a test case
export interface TestCaseInput {
  type: string // e.g., "int", "int[]", "string"
  value: any
}

// Expected output for a test case
export interface TestCaseOutput {
  type: string
  value: any
}

// Test case structure matching backend JSONB format
export interface TestCase {
  id: number
  problem_id: number
  inputs: TestCaseInput[]          // JSONB array
  expected_output: TestCaseOutput  // JSONB object
  is_hidden: boolean
  points: number
}

// Language-specific limits
export interface LanguageLimit {
  timeMs: number
  memoryKb: number
}

export interface LanguageLimits {
  [language: string]: LanguageLimit
}

// Problem structure matching backend models
export interface Problem {
  id: number
  class_id: number
  title: string
  description: string
  markdown_content?: string            // NEW: Optional markdown description
  difficulty: Difficulty
  language: Language                   // Required: target language for the problem
  function_signature: string           // Required: function signature
  function_name?: string               // Extracted from signature
  parameter_types?: string[]           // e.g., ["int[]", "int"]
  time_limit_ms: number
  memory_limit_kb: number
  language_limits?: LanguageLimits
  test_cases: TestCase[]
  due_date?: string
  created_at?: string
  // Convenience aliases for backward compatibility
  time_limit?: number  // Alias for time_limit_ms
  memory_limit?: number // Alias for memory_limit_kb
  grading_mode?: 'stdio' | 'function' // Deprecated: always 'function' now
}

export interface CreateProblemRequest {
  title: string
  description: string
  markdown_content?: string            // NEW: Optional markdown description
  difficulty: Difficulty
  language: Language
  function_signature: string
  time_limit_ms?: number
  memory_limit_kb?: number
  language_limits?: LanguageLimits
  test_cases: Array<{
    inputs: TestCaseInput[]
    expected_output: TestCaseOutput
    is_hidden: boolean
    points: number
  }>
}

// ============================================
// Submission Types
// ============================================

export interface TestResult {
  test_case_id: number | null
  status: SubmissionStatus
  execution_time_ms?: number
  memory_used_kb?: number
  output_received?: string
  error_message?: string
  is_hidden?: boolean
  points_earned?: number
}

export interface Submission {
  id: number
  problem_id: number
  student_id: number
  user?: User
  source_code: string
  code?: string  // Alias for compatibility
  language: Language
  status: SubmissionStatus
  cached_score?: number
  is_test?: boolean
  submitted_at: string
  results?: TestResult[]
  // Computed/convenience fields
  score?: number
  total_tests?: number
  passed_tests?: number
  totalTests?: number  // Alias for convenience
  passedTests?: number // Alias for convenience
  submittedAt?: string // Alias for convenience
}

export interface SubmitCodeRequest {
  problem_id: number
  source_code: string
  language: Language
  is_test?: boolean
}

export interface SubmissionResult {
  submission_id?: number
  status: SubmissionStatus
  message: string
  score?: number
  passed_tests?: number
  total_tests?: number
  test_results?: TestResult[]
  // Legacy/convenience fields
  isTest?: boolean
  results?: TestResult[]  // Alias for test_results
}

// ============================================
// Statistics Types
// ============================================

export interface SubmissionStats {
  total_students: number
  accepted_count: number
  acceptance_rate: string
  average_score: string
  // Convenience aliases for camelCase
  totalStudents?: number
  acceptedCount?: number
  acceptanceRate?: string
  averageScore?: string
}

export interface Student {
  id: number
  full_name: string
  email: string
  enrolled_at?: string
}

// ============================================
// API Response Types
// ============================================

export interface APIResponse<T = any> {
  status: 'success' | 'error'
  message?: string
  msg?: string
  data?: T
}

export interface APIError {
  error?: string
  msg?: string
  message?: string
  status: number
  details?: any
}

// ============================================
// Resource Types (for attachments/links)
// ============================================

export interface Resource {
  id: number
  problem_id: number
  file_name: string
  file_url: string
  file_size?: number
  file_type?: string
  resource_type: 'file' | 'drive_link' | 'external_link'
  drive_link?: string
  description?: string
  uploaded_at?: string
  uploaded_by?: number
}
