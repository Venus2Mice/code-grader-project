/**
 * DEPRECATED: Use types from @/types/index.ts instead
 * This file is kept for backward compatibility only
 */

// Re-export from centralized types
export type {
  User,
  Submission,
  SubmissionStats,
  TestResult,
  SubmissionStatus
} from './index'

// Legacy type alias
import type { Submission } from './index'

export interface StudentSubmission extends Submission {
  allSubmissions?: Submission[]
}
