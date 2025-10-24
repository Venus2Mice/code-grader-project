/**
 * Standardized API Response Types
 * Định nghĩa chuẩn các response types từ backend
 */

// ============================================
// Base Response Types
// ============================================

export interface APIResponse<T = any> {
  data: T
  message?: string
  status: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ============================================
// Auth & User Types
// ============================================

export interface User {
  id: number
  username: string
  email: string
  full_name: string
  role: "student" | "teacher" | "admin"
  created_at: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  full_name: string
  role: "student" | "teacher"
}

export interface RegisterResponse {
  message: string
  user: User
}

// ============================================
// Class Types
// ============================================

export interface Class {
  id: number
  name: string
  description: string
  class_code: string
  teacher_id: number
  teacher_name?: string
  created_at: string
  student_count?: number
  problem_count?: number
}

export interface ClassMember {
  id: number
  user_id: number
  class_id: number
  username: string
  full_name: string
  email: string
  joined_at: string
}

export interface CreateClassRequest {
  name: string
  description: string
}

export interface JoinClassRequest {
  class_code: string
}

// ============================================
// Problem Types
// ============================================

export interface TestCase {
  id: number
  input: string
  expected_output: string
  is_hidden: boolean
  points: number
  problem_id?: number
}

export interface Problem {
  id: number
  title: string
  description: string
  difficulty: "easy" | "medium" | "hard"
  time_limit_ms: number
  memory_limit_kb: number
  grading_mode: "stdio" | "function"
  function_signature?: string
  test_cases: TestCase[]
  class_id?: number
  created_by?: number
  created_at?: string
  submission_count?: number
  accepted_count?: number
}

export interface CreateProblemRequest {
  title: string
  description: string
  difficulty: "easy" | "medium" | "hard"
  time_limit_ms: number
  memory_limit_kb: number
  grading_mode: "stdio" | "function"
  function_signature?: string
  class_id?: number
  test_cases: Omit<TestCase, "id" | "problem_id">[]
}

export interface UpdateProblemRequest extends Partial<CreateProblemRequest> {
  id: number
}

// ============================================
// Submission Types
// ============================================

export interface TestResult {
  test_case_id: number
  status: "accepted" | "wrong_answer" | "runtime_error" | "time_limit_exceeded" | "memory_limit_exceeded"
  output_received?: string
  expected_output?: {
    type: string
    value: any
  }
  error_message?: string
  execution_time_ms: number
  memory_used_kb: number
  is_hidden: boolean
  points_earned?: number
}

export interface Submission {
  id: number
  user_id: number
  username?: string
  full_name?: string
  problem_id: number
  problem_title?: string
  code: string
  language: "cpp" | "python" | "java"
  status: "pending" | "running" | "accepted" | "wrong_answer" | "runtime_error" | "compile_error" | "time_limit_exceeded" | "memory_limit_exceeded"
  score: number
  passed_tests: number
  total_tests: number
  execution_time_ms?: number
  memory_used_kb?: number
  submitted_at: string
  test_results?: TestResult[]
}

export interface SubmitCodeRequest {
  problem_id: number
  code: string
  language: "cpp" | "python" | "java"
  is_test?: boolean
}

export interface SubmissionResult {
  submission_id?: number
  status: "accepted" | "wrong_answer" | "runtime_error" | "compile_error" | "time_limit_exceeded" | "memory_limit_exceeded" | "pending" | "running"
  message: string
  score: number
  passed_tests: number
  total_tests: number
  execution_time_ms?: number
  memory_used_kb?: number
  test_results: TestResult[]
}

// ============================================
// Leaderboard Types
// ============================================

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
// Error Types
// ============================================

export interface APIError {
  error: string
  message: string
  status: number
  details?: any
}

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

export function isAPIError(error: any): error is APIError {
  return error && typeof error.error === "string" && typeof error.status === "number"
}

export function isSubmission(obj: any): obj is Submission {
  return obj && typeof obj.id === "number" && typeof obj.code === "string"
}

export function isProblem(obj: any): obj is Problem {
  return obj && typeof obj.id === "number" && typeof obj.title === "string" && Array.isArray(obj.test_cases)
}

// ============================================
// Utility Types
// ============================================

/**
 * Make certain fields required
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>

/**
 * Make certain fields optional
 */
export type PartialFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Extract data from API response
 */
export type ExtractData<T> = T extends APIResponse<infer U> ? U : T
