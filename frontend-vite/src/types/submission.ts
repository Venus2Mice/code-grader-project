export interface User {
  id: number
  full_name: string
  email: string
  username?: string
}

export interface Submission {
  id: number
  problem_id: number
  user_id: number
  user?: User
  source_code?: string
  code?: string
  language: string
  status: string
  score: number
  passedTests?: number
  passed_tests?: number
  totalTests?: number
  total_tests?: number
  submittedAt?: string
  submitted_at?: string
  results?: any[]
}

export interface SubmissionStats {
  totalStudents: number
  acceptedCount: number
  acceptanceRate: string
  averageScore: string
}

export interface StudentSubmission extends Submission {
  allSubmissions?: Submission[]
}
