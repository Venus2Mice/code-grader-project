import { useState } from "react"
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
  useProblemData,
  useErrorModal,
  useErrorHandler
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

  // Use error modal and handler hooks
  const { errorModal, openError, closeError } = useErrorModal()
  const { handleErrorDisplay } = useErrorHandler()

  // File upload
  const fileUploadProps = useFileUpload({
    onCodeLoaded: (newCode, fileName) => {
      loadCode(newCode)
      setIsUploadModalOpen(false)
    },
    onError: (title, message) => {
      openError(title, message)
    },
    analyzeCppCode
  })

  // Wrapper for error handling that matches useSubmission callback signature
  const onSubmissionError = (errorResult: any) => {
    handleErrorDisplay(errorResult, analyzeRuntimeError)
  }

  // Handle run
  const handleRun = () => {
    runCode(code, language, onSubmissionError)
  }

  // Handle submit
  const handleSubmit = () => {
    submitCode(code, language, onSubmissionError)
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
    openError(
      `${analysis.errorType} - Test Case #${testCaseId || 'N/A'}`,
      `${errorMessage}\n\n${'='.repeat(50)}\n\n${analysis.suggestions}`
    )
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
        hasResetTemplate={!!originalTemplate} // Function-based grading always has template
      />

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        <div className="lg:w-1/2 overflow-y-auto border-b-4 lg:border-b-0 lg:border-r-4 border-border bg-card max-h-[40vh] lg:max-h-none">
          <ProblemDescription
            problem={problem}
            submissions={submissions}
            onViewSubmission={handleViewSubmission}
            getStatusDisplay={getStatusDisplay}
            formatVietnameseDate={formatVietnameseDate}
            selectedLanguage={language}
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
        onClose={closeError}
        title={errorModal.title}
        message={errorModal.message}
      />
    </div>
  )
}
