import { useCallback } from 'react'
import { useErrorModal } from './useErrorModal'

interface ErrorResult {
  status?: string
  error_message?: string
  test_case_id?: string | number | null
}

/**
 * Custom hook for handling submission error display
 * Analyzes error types and displays appropriate modal messages
 */
export function useErrorHandler() {
  const { openError } = useErrorModal()

  const handleErrorDisplay = useCallback((
    errorResult: ErrorResult,
    analyzeRuntimeError: (msg: string) => { errorType: string; suggestions: string }
  ) => {
    const statusNorm = String(errorResult.status || '').toLowerCase()
    const errorMsg = errorResult.error_message || ''

    if (statusNorm.includes('compile')) {
      openError(
        'Compilation Error',
        errorMsg || 'Your code has compilation errors. Please fix them before submitting.'
      )
    } else if (
      statusNorm.includes('runtime') ||
      statusNorm.includes('time limit') ||
      statusNorm.includes('memory limit') ||
      statusNorm.includes('output limit')
    ) {
      // Handle runtime errors with or without detailed message
      if (!errorMsg || errorMsg === errorResult.status) {
        // No detailed error message - provide generic runtime error info
        let genericMessage = statusNorm
        if (statusNorm.includes('time limit')) {
          genericMessage =
            '⏱️ Time Limit Exceeded\n\n' +
            'Your program took too long to execute.\n\n' +
            'Common causes:\n' +
            '• Infinite loop without break condition\n' +
            '• Inefficient algorithm\n' +
            '• Excessive I/O operations'
        } else if (statusNorm.includes('memory limit')) {
          genericMessage =
            '💾 Memory Limit Exceeded\n\n' +
            'Your program used too much memory.\n\n' +
            'Common causes:\n' +
            '• Large array allocation\n' +
            '• Memory leak\n' +
            '• Too deep recursion'
        } else if (statusNorm.includes('output limit')) {
          genericMessage =
            '📄 Output Limit Exceeded\n\n' +
            'Your program produced too much output.\n\n' +
            'Common causes:\n' +
            '• Infinite printing loop (e.g., while(true) cout << ...)\n' +
            '• Not reading input correctly\n' +
            '• Debug statements in loops'
        } else {
          genericMessage =
            `❌ ${errorResult.status}\n\n` +
            'A runtime error occurred during execution.\n\n' +
            'Please check your code for common issues like:\n' +
            '• Division by zero\n' +
            '• Array out of bounds\n' +
            '• Null pointer access\n' +
            '• Infinite loops'
        }

        openError(
          `${errorResult.status} - Test Case #${errorResult.test_case_id || 'N/A'}`,
          genericMessage
        )
      } else {
        // Has detailed error message from worker
        const analysis = analyzeRuntimeError(errorMsg)

        // If the error message is already formatted with new details, use it directly
        let displayMessage: string

        if (errorMsg.includes('|') || errorMsg.includes('❌') || errorMsg.includes('💡')) {
          // New detailed format - just add separator if needed
          if (analysis.suggestions && !errorMsg.includes(analysis.suggestions)) {
            displayMessage = `${errorMsg}\n\n${'='.repeat(50)}\n\n${analysis.suggestions}`
          } else {
            displayMessage = errorMsg
          }
        } else {
          // Legacy format - combine error message with suggestions
          displayMessage = `${errorMsg}\n\n${'='.repeat(50)}\n\n${analysis.suggestions}`
        }

        openError(
          `${analysis.errorType} - Test Case #${errorResult.test_case_id || 'N/A'}`,
          displayMessage
        )
      }
    } else {
      openError(
        `Error: ${errorResult.status || 'Unknown'}`,
        errorMsg || 'An error occurred during grading. Please try again.'
      )
    }
  }, [openError])

  return {
    handleErrorDisplay,
  }
}
