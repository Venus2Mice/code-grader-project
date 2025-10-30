/**
 * DEPRECATED: Use types from @/types/index.ts instead
 * This file is kept for backward compatibility only
 */

// Re-export from centralized types
export type {
  TestCase,
  TestCaseInput,
  TestCaseOutput,
  Problem,
  TestResult,
  SubmissionResult
} from './index'

// Legacy types for backward compatibility
export interface CodeAnalysis {
  hasMain: boolean
  hasFunctions: boolean
  analysis: string
}
