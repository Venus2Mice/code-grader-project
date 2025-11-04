
import { useState, useCallback } from "react"
import { submissionAPI } from "@/services/api"
import type { SubmissionResult, TestResult, Problem } from "@/types"
import { logger } from "@/lib/logger"
import { extractImplementation } from "@/lib/codeExtractor"

interface UseSubmissionProps {
  problemToken: string
  problem: Problem | null
  onSubmissionComplete?: () => void
}

export function useSubmission({ problemToken, problem, onSubmissionComplete }: UseSubmissionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<SubmissionResult | null>(null)

  const computeResults = useCallback((submissionData: any): SubmissionResult => {
    // 🔍 DEBUG: Log computation input
    console.log('🔍 VITE COMPUTE RESULTS INPUT:', {
      status: submissionData.status,
      results: submissionData.results,
      resultsLength: submissionData.results?.length,
      manualScore: submissionData.manual_score,
      cachedScore: submissionData.cached_score
    })
    
    const resultsArr: TestResult[] = submissionData.results && Array.isArray(submissionData.results) 
      ? submissionData.results 
      : []
    
    const totalTestsComputed = resultsArr.filter((r: any) => 
      r.test_case_id !== null && r.test_case_id !== undefined
    ).length
    
    const passedTestsComputed = resultsArr.reduce((acc: number, r: any) => {
      const s = String(r.status || '').toLowerCase()
      if (['passed', 'accepted', 'ok', 'success'].includes(s)) return acc + 1
      return acc
    }, 0)
    
    // 🔍 DEBUG: Log passed tests calculation
    console.log('🔍 VITE PASSED TESTS:', {
      passedTestsComputed,
      totalTestsComputed,
      resultsStatuses: resultsArr.map(r => r.status)
    })

    // ✅ PRIORITY: manual_score > cached_score
    // If teacher has manually graded, use manual_score
    // Otherwise, use cached_score (will be NULL if not graded by teacher)
    const scoreComputed = submissionData.manual_score !== undefined && submissionData.manual_score !== null
      ? submissionData.manual_score
      : (submissionData.cached_score !== undefined && submissionData.cached_score !== null
        ? submissionData.cached_score
        : (submissionData.score || 0))

    const finalStatus = (passedTestsComputed > 0 && totalTestsComputed > 0 && passedTestsComputed === totalTestsComputed) 
      ? 'Accepted' 
      : (submissionData.status === 'Compile Error' ? 'Compile Error' : 'error')

    return {
      status: finalStatus as any,
      message: submissionData.status,
      isTest: false,
      score: scoreComputed,
      passed_tests: passedTestsComputed,
      total_tests: totalTestsComputed,
      test_results: resultsArr,
      results: resultsArr  // Alias
    }
  }, [])

  const pollSubmission = useCallback(async (
    submissionId: number, 
    isTest: boolean,
    onError: (result: any) => void
  ) => {
    const MAX_POLL_ATTEMPTS = 15
    const MAX_BACKOFF_MS = 8000
    const INITIAL_BACKOFF_MS = 1000

    try {
      // Iterative polling instead of recursive (prevents stack overflow)
      for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++) {
        // Calculate exponential backoff
        const backoffMs = Math.min(
          INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1),
          MAX_BACKOFF_MS
        )

        // Wait before polling
        await new Promise(resolve => setTimeout(resolve, backoffMs))

        try {
          const resultResponse = await submissionAPI.getById(submissionId)
          const submissionData = resultResponse.data

          // 🔍 DEBUG: Log full submission data
          console.log('🔍 VITE POLLING RESULT:', JSON.stringify(submissionData, null, 2))

          // Check if grading is complete
          if (submissionData.status !== 'Pending' && submissionData.status !== 'Running') {
            isTest ? setIsRunning(false) : setIsSubmitting(false)

            // ✅ ENHANCED: Check for errors and call onError callback
            // Priority 1: Check if there's any error result with error_message
            if (submissionData.results && submissionData.results.length > 0) {
              const errorResult = submissionData.results.find((r: any) => r.error_message)
              if (errorResult && errorResult.error_message) {
                onError(errorResult)
              }
            }

            // ✅ NEW: Priority 2: Check overall status for runtime errors
            // Even if no detailed error_message, show modal for known error statuses
            const statusLower = String(submissionData.status || '').toLowerCase()
            if (!submissionData.results || submissionData.results.length === 0) {
              // No results but error status - create synthetic error for modal
              if (
                statusLower.includes('error') ||
                statusLower.includes('timeout') ||
                statusLower.includes('time limit') ||
                statusLower.includes('memory limit') ||
                statusLower.includes('output limit')
              ) {
                onError({
                  status: submissionData.status,
                  error_message: submissionData.status || 'An error occurred during grading',
                  test_case_id: null
                })
              }
            }

            const result = computeResults(submissionData)
            setTestResults({ ...result, isTest })

            // Call completion callback for actual submissions
            if (!isTest && onSubmissionComplete) {
              onSubmissionComplete()
            }
            return
          }

          // Still pending - continue to next iteration
        } catch (pollErr) {
          logger.error('Error polling results', pollErr)
          // Continue polling on network errors
        }
      }

      // Max attempts exceeded
      isTest ? setIsRunning(false) : setIsSubmitting(false)
      setTestResults({
        status: 'error',
        message: isTest 
          ? 'Test timeout - taking too long' 
          : 'Grading timeout - please check submission history',
        isTest
      })
    } catch (err) {
      logger.error('Fatal error in poll submission', err)
      isTest ? setIsRunning(false) : setIsSubmitting(false)
      setTestResults({
        status: 'error',
        message: isTest ? 'Failed to get test results' : 'Failed to get submission results',
        isTest
      })
    }
  }, [computeResults, onSubmissionComplete])

  const runCode = useCallback(async (
    code: string, 
    language: string,
    onError: (result: any) => void
  ) => {
    setIsRunning(true)
    setTestResults(null)
    
    try {
      // Extract just the method body/implementation from the student code
      const implementation = extractImplementation(code, language)
      
      const problemId = problem?.id
      if (!problemId) {
        throw new Error('Problem ID not available')
      }
      
      logger.debug('Testing code (not saved to history)', { problemId, language })
      const response = await submissionAPI.runCode({
        problem_id: problemId,
        source_code: implementation,
        language: language
      })
      
      const submissionId = response.data.submission_id
      logger.debug('Test submission created', { submissionId })
      
      setTestResults({
        status: "Running",
        message: "Testing your code...",
        isTest: true
      })
      
      await pollSubmission(submissionId, true, onError)
    } catch (err: any) {
      logger.error('Error running code', err)
      setTestResults({
        status: "error",
        message: err.response?.data?.msg || 'Failed to run code',
        isTest: true
      })
      setIsRunning(false)
    }
  }, [problem, pollSubmission])

  const submitCode = useCallback(async (
    code: string, 
    language: string,
    onError: (result: any) => void
  ) => {
    setIsSubmitting(true)
    setTestResults(null)
    
    try {
      // Extract just the method body/implementation from the student code
      const implementation = extractImplementation(code, language)
      
      const problemId = problem?.id
      if (!problemId) {
        throw new Error('Problem ID not available')
      }
      
      logger.info('Submitting code for grading', { problemId, language })
      const response = await submissionAPI.create({
        problem_id: problemId,
        source_code: implementation,
        language: language
      })
      
      const submissionId = response.data.submission_id || response.data.id
      logger.info('Submission created', { submissionId })
      
      setTestResults({
        status: "Pending",
        message: "Submission queued for grading...",
        isTest: false
      })
      
      // Immediately call refresh if provided
      if (onSubmissionComplete) {
        onSubmissionComplete()
      }
      
      await pollSubmission(submissionId, false, onError)
    } catch (err: any) {
      logger.error('Error submitting code', err)
      setTestResults({
        status: "error",
        message: err.response?.data?.msg || 'Failed to submit code',
        isTest: false
      })
      setIsSubmitting(false)
    }
  }, [problem, pollSubmission, onSubmissionComplete])

  return {
    isSubmitting,
    isRunning,
    testResults,
    setTestResults,
    runCode,
    submitCode
  }
}
