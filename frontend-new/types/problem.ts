export interface TestCase {
  id: number
  input: string
  expected_output: string
  expectedOutput?: string
  is_hidden: boolean
  points: number
}

export interface Problem {
  id: number
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  time_limit: number
  time_limit_ms?: number
  memory_limit: number
  memory_limit_kb?: number
  grading_mode: 'stdio' | 'function'
  function_signature?: string
  test_cases: TestCase[]
  class_id?: number
}

export interface TestResult {
  test_case_id: number | null
  status: string
  output_received?: string
  expected_output?: string
  error_message?: string
  execution_time_ms?: number
  memory_used_kb?: number
  is_hidden?: boolean
}

export interface SubmissionResult {
  status: 'accepted' | 'running' | 'pending' | 'error' | 'compile_error' | 'info'
  message: string
  isTest: boolean
  score?: number
  passedTests?: number
  totalTests?: number
  results?: TestResult[]
}

export interface CodeAnalysis {
  hasMain: boolean
  hasFunctions: boolean
  analysis: string
}
