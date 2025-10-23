
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { submissionAPI } from "@/services/api"
import { CodeEditor } from "@/components/code-editor"
import {
  ProblemHeader,
  ProblemDescription,
  TestResultsPanel,
  ErrorModal,
  FileUploadModal,
  SubmissionHistoryModal,
  ResetConfirmModal
} from "@/components/problem"
import {
  useCodeAnalysis,
  useCodeEditor,
  useFileUpload,
  useRuntimeErrorAnalysis,
  useSubmission,
  useSubmissionHistory,
  useProblemData
} from "@/hooks/problem"
import { getStatusDisplay, formatVietnameseDate } from "@/lib/problemUtils"
import { logger } from "@/lib/logger"

export default function ProblemSolvePage() {
  const { id } = useParams<{ id: string }>()
  const problemId = Number(id)

  // Fetch problem data
  const { problem, isLoading, classId } = useProblemData(problemId)

  // Code editor state
  const { code, setCode, language, setLanguage, originalTemplate, resetCode, loadCode } = useCodeEditor({ problem })

  // Submission handling
  const { submissions, refreshSubmissions } = useSubmissionHistory(problemId)
  const { isSubmitting, isRunning, testResults, setTestResults, runCode, submitCode } = useSubmission({
    problemId,
    problem,
    onSubmissionComplete: refreshSubmissions
  })

  // Analysis and utilities
  const { analyzeCppCode } = useCodeAnalysis()
  const { analyzeRuntimeError } = useRuntimeErrorAnalysis()

  // Modal states
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    title: "",
    message: ""
  })

  // File upload
  const fileUploadProps = useFileUpload({
    onCodeLoaded: (newCode, fileName) => {
      loadCode(newCode)
      setIsUploadModalOpen(false)
    },
    onError: (title, message) => {
      setErrorModal({ isOpen: true, title, message })
    },
    analyzeCppCode,
    gradingMode: problem?.grading_mode
  })

  // Handle error display from submission results
  const handleErrorDisplay = (errorResult: any) => {
    const statusNorm = String(errorResult.status || '').toLowerCase()
    const errorMsg = errorResult.error_message || ''
    
    if (statusNorm.includes('compile')) {
      setErrorModal({
        isOpen: true,
        title: "Compilation Error",
        message: errorMsg || 'Your code has compilation errors. Please fix them before submitting.'
      })
    } else if (statusNorm.includes('runtime') || statusNorm.includes('time limit') || statusNorm.includes('memory limit') || statusNorm.includes('output limit')) {
      // ✅ ENHANCED: Handle runtime errors with or without detailed message
      if (!errorMsg || errorMsg === errorResult.status) {
        // No detailed error message - provide generic runtime error info
        let genericMessage = statusNorm
        if (statusNorm.includes('time limit')) {
          genericMessage = "⏱️ Time Limit Exceeded\n\nYour program took too long to execute.\n\nCommon causes:\n• Infinite loop without break condition\n• Inefficient algorithm\n• Excessive I/O operations"
        } else if (statusNorm.includes('memory limit')) {
          genericMessage = "💾 Memory Limit Exceeded\n\nYour program used too much memory.\n\nCommon causes:\n• Large array allocation\n• Memory leak\n• Too deep recursion"
        } else if (statusNorm.includes('output limit')) {
          genericMessage = "📄 Output Limit Exceeded\n\nYour program produced too much output.\n\nCommon causes:\n• Infinite printing loop (e.g., while(true) cout << ...)\n• Not reading input correctly\n• Debug statements in loops"
        } else {
          genericMessage = `❌ ${errorResult.status}\n\nA runtime error occurred during execution.\n\nPlease check your code for common issues like:\n• Division by zero\n• Array out of bounds\n• Null pointer access\n• Infinite loops`
        }
        
        setErrorModal({
          isOpen: true,
          title: `${errorResult.status} - Test Case #${errorResult.test_case_id || 'N/A'}`,
          message: genericMessage
        })
      } else {
        // Has detailed error message from worker
        const analysis = analyzeRuntimeError(errorMsg)
        
        // ✅ If the error message is already formatted with new details, use it directly
        // (The analyzeRuntimeError will parse it and extract the suggestions)
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
        
        setErrorModal({
          isOpen: true,
          title: `${analysis.errorType} - Test Case #${errorResult.test_case_id || 'N/A'}`,
          message: displayMessage
        })
      }
    } else {
      setErrorModal({
        isOpen: true,
        title: `Error: ${errorResult.status || 'Unknown'}`,
        message: errorMsg || 'An error occurred during grading. Please try again.'
      })
    }
  }

  // Handle run
  const handleRun = () => {
    runCode(code, language, handleErrorDisplay)
  }

  // Handle submit
  const handleSubmit = () => {
    submitCode(code, language, handleErrorDisplay)
  }

  // Handle view submission
  const handleViewSubmission = async (submission: any) => {
    if (submission.code) {
      loadCode(submission.code)
      setLanguage(submission.language || 'cpp')
      setIsHistoryOpen(false)
      return
    }
    
    try {
      const codeResponse = await submissionAPI.getCode(submission.id)
      loadCode(codeResponse.data.code || codeResponse.data.source_code || '')
      setLanguage(codeResponse.data.language || submission.language || 'cpp')
      setIsHistoryOpen(false)
    } catch (err) {
      logger.error('Error fetching submission code', err, { submissionId: submission.id })
    }
  }

  // Handle reset
  const handleResetConfirm = () => {
    resetCode()
    setTestResults(null)
    setIsResetModalOpen(false)
  }

  // Handle view error details from test results
  const handleViewErrorDetails = (errorMessage: string, testCaseId: number) => {
    const analysis = analyzeRuntimeError(errorMessage)
    setErrorModal({
      isOpen: true,
      title: `${analysis.errorType} - Test Case #${testCaseId || 'N/A'}`,
      message: `${errorMessage}\n\n${'='.repeat(50)}\n\n${analysis.suggestions}`
    })
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
      </div>
    )
  }

  if (!problem) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-black uppercase text-foreground mb-4">Problem not found</h2>
          <p className="text-muted-foreground font-bold">The requested problem does not exist</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <ProblemHeader
        problem={problem}
        classId={classId}
        language={language}
        onLanguageChange={setLanguage}
        onReset={() => setIsResetModalOpen(true)}
        onUpload={() => setIsUploadModalOpen(true)}
        onHistory={() => setIsHistoryOpen(true)}
        onRun={handleRun}
        onSubmit={handleSubmit}
        isRunning={isRunning}
        isSubmitting={isSubmitting}
        submissionsCount={submissions.length}
        hasResetTemplate={!!originalTemplate && problem.grading_mode === 'function'}
      />

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        <div className="lg:w-1/2 overflow-y-auto border-b-4 lg:border-b-0 lg:border-r-4 border-border bg-card max-h-[40vh] lg:max-h-none">
          <ProblemDescription
            problem={problem}
            submissions={submissions}
            onViewSubmission={handleViewSubmission}
            getStatusDisplay={getStatusDisplay}
            formatVietnameseDate={formatVietnameseDate}
          />
        </div>

        <div className="flex lg:w-1/2 flex-col bg-background flex-1">
          <div className="flex-1 overflow-hidden border-4 border-border m-2 md:m-4">
            <CodeEditor value={code} onChange={setCode} language={language} />
          </div>

          <TestResultsPanel
            testResults={testResults}
            onViewErrorDetails={handleViewErrorDetails}
          />
        </div>
      </div>

      <SubmissionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        submissions={submissions}
        onViewSubmission={handleViewSubmission}
        getStatusDisplay={getStatusDisplay}
        formatVietnameseDate={formatVietnameseDate}
      />

      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleResetConfirm}
      />

      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        isDragging={fileUploadProps.isDragging}
        uploadedFileName={fileUploadProps.uploadedFileName}
        language={language}
        fileInputRef={fileUploadProps.fileInputRef}
        onFileUpload={fileUploadProps.handleFileUpload}
        onDragOver={fileUploadProps.handleDragOver}
        onDragLeave={fileUploadProps.handleDragLeave}
        onDrop={fileUploadProps.handleDrop}
        onCodeExtracted={(extractedCode) => {
          loadCode(extractedCode)
        }}
      />

      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
        title={errorModal.title}
        message={errorModal.message}
      />
    </div>
  )
}
