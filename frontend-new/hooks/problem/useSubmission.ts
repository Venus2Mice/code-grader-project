"use client"

import { useState, useCallback } from "react"
import { submissionAPI } from "@/services/api"
import type { SubmissionResult, TestResult, Problem } from "@/types/problem"
import { logger } from "@/lib/logger"

interface UseSubmissionProps {
  problemId: number
  problem: Problem | null
  onSubmissionComplete?: () => void
}

export function useSubmission({ problemId, problem, onSubmissionComplete }: UseSubmissionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<SubmissionResult | null>(null)

  const computeResults = useCallback((submissionData: any): SubmissionResult => {
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

    // Compute score by points when problem test_cases available, otherwise by count
    let scoreComputed = 0
    try {
      const totalPoints = (problem && problem.test_cases && problem.test_cases.length > 0)
        ? problem.test_cases.reduce((sum: number, tc: any) => sum + (tc.points || 0), 0)
        : 0

      if (totalPoints > 0) {
        const earnedPoints = resultsArr.reduce((sum: number, r: any) => {
          const s = String(r.status || '').toLowerCase()
          if (['passed', 'accepted', 'ok', 'success'].includes(s)) {
            const tc = problem!.test_cases.find((t: any) => t.id === r.test_case_id)
            return sum + (tc ? (tc.points || 0) : 0)
          }
          return sum
        }, 0)
        scoreComputed = Math.round((earnedPoints / totalPoints) * 100)
      } else if (totalTestsComputed > 0) {
        scoreComputed = Math.round((passedTestsComputed / totalTestsComputed) * 100)
      } else {
        scoreComputed = submissionData.score || 0
      }
    } catch (e) {
      scoreComputed = submissionData.score || 0
    }

    const finalStatus = (passedTestsComputed > 0 && totalTestsComputed > 0 && passedTestsComputed === totalTestsComputed) 
      ? 'accepted' 
      : (submissionData.status === 'Compile Error' ? 'compile_error' : 'error')

    return {
      status: finalStatus as any,
      message: submissionData.status,
      isTest: false,
      score: scoreComputed,
      passedTests: passedTestsComputed,
      totalTests: totalTestsComputed,
      results: resultsArr
    }
  }, [problem])

  const pollSubmission = useCallback(async (
    submissionId: number, 
    isTest: boolean,
    onError: (result: any) => void
  ) => {
    let pollCount = 0
    
    const poll = async (): Promise<void> => {
      try {
        pollCount++
        const backoffMs = Math.min(1000 * Math.pow(2, pollCount - 1), 8000)
        
        await new Promise(resolve => setTimeout(resolve, backoffMs))
        
        const resultResponse = await submissionAPI.getById(submissionId)
        const submissionData = resultResponse.data
        
        // Check if grading is complete
        if (submissionData.status !== 'Pending' && submissionData.status !== 'Running') {
          isTest ? setIsRunning(false) : setIsSubmitting(false)
          
          // Check for errors and call onError callback
          if (submissionData.results && submissionData.results.length > 0) {
            const errorResult = submissionData.results.find((r: any) => r.error_message)
            if (errorResult && errorResult.error_message) {
              onError(errorResult)
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
        
        // Still pending - continue polling
        if (pollCount < 15) {
          await poll()
        } else {
          isTest ? setIsRunning(false) : setIsSubmitting(false)
          setTestResults({
            status: "error",
            message: isTest ? "Test timeout - taking too long" : "Grading timeout - please check submission history",
            isTest
          })
        }
      } catch (pollErr) {
        logger.error('Error polling results', pollErr)
        isTest ? setIsRunning(false) : setIsSubmitting(false)
        setTestResults({
          status: "error",
          message: isTest ? "Failed to get test results" : "Failed to get submission results",
          isTest
        })
      }
    }
    
    await poll()
  }, [computeResults, onSubmissionComplete])

  const runCode = useCallback(async (
    code: string, 
    language: string,
    onError: (result: any) => void
  ) => {
    setIsRunning(true)
    setTestResults(null)
    
    try {
      logger.debug('Testing code (not saved to history)', { problemId, language })
      const response = await submissionAPI.runCode({
        problem_id: problemId,
        source_code: code,
        language: language
      })
      
      const submissionId = response.data.submission_id
      logger.debug('Test submission created', { submissionId })
      
      setTestResults({
        status: "running",
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
  }, [problemId, pollSubmission])

  const submitCode = useCallback(async (
    code: string, 
    language: string,
    onError: (result: any) => void
  ) => {
    setIsSubmitting(true)
    setTestResults(null)
    
    try {
      logger.info('Submitting code for grading', { problemId, language })
      const response = await submissionAPI.create({
        problem_id: problemId,
        source_code: code,
        language: language
      })
      
      const submissionId = response.data.submission_id || response.data.id
      logger.info('Submission created', { submissionId })
      
      setTestResults({
        status: "pending",
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
  }, [problemId, pollSubmission, onSubmissionComplete])

  return {
    isSubmitting,
    isRunning,
    testResults,
    setTestResults,
    runCode,
    submitCode
  }
}
