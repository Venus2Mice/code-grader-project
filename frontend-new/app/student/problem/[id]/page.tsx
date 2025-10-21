"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
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
  const params = useParams()
  const problemId = Number(params.id)

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
    
    if (statusNorm.includes('compile')) {
      setErrorModal({
        isOpen: true,
        title: "Compilation Error",
        message: errorResult.error_message
      })
    } else if (statusNorm.includes('runtime') || statusNorm.includes('time limit') || statusNorm.includes('memory limit')) {
      const analysis = analyzeRuntimeError(errorResult.error_message)
      setErrorModal({
        isOpen: true,
        title: `${analysis.errorType} - Test Case #${errorResult.test_case_id || 'N/A'}`,
        message: `${errorResult.error_message}\n\n${'='.repeat(50)}\n\n${analysis.suggestions}`
      })
    } else {
      setErrorModal({
        isOpen: true,
        title: `Error: ${errorResult.status || 'Unknown'}`,
        message: errorResult.error_message
      })
    }
  }

  // Handle run
  const handleRun = () => {
    runCode(code, language, handleErrorDisplay)
  }

  // Handle submit with validation
  const handleSubmit = () => {
    if (language !== 'cpp') {
      setErrorModal({
        isOpen: true,
        title: "Invalid Submission",
        message: "Only C++ (.cpp) files can be submitted. Please select C++ as the language."
      })
      return
    }
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
