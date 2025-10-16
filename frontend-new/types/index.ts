export type UserRole = "teacher" | "student"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
}

export interface Class {
  id: string
  name: string
  description: string
  code: string
  teacherId: string
  createdAt: Date
  studentCount: number
}

export interface Problem {
  id: string
  classId: string
  title: string
  description: string
  difficulty: "easy" | "medium" | "hard"
  timeLimit: number
  memoryLimit: number
  gradingMode: "stdio" | "function"
  functionSignature?: string
  testCases: TestCase[]
  createdAt: Date
}

export interface TestCase {
  id: string
  input: string
  expectedOutput: string
  isHidden: boolean
  points: number
}

export interface Submission {
  id: string
  problemId: string
  studentId: string
  code: string
  language: string
  status: "pending" | "running" | "accepted" | "wrong_answer" | "compile_error" | "runtime_error" | "time_limit"
  score: number
  totalTests: number
  passedTests: number
  submittedAt: Date
}

export interface Student {
  id: string
  name: string
  email: string
  enrolledAt: Date
}
