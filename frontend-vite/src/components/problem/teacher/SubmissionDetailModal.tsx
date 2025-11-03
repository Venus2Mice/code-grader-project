import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ManualGradingPanel } from "./ManualGradingPanel"
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"
import type { Submission } from "@/types"

interface SubmissionDetailModalProps {
  isOpen: boolean
  onClose: () => void
  submission: Submission | null
  sourceCode: string | null
  isLoadingCode: boolean
  onGradeSuccess?: () => void
}

const getStatusIcon = (status: string) => {
  const statusLower = status?.toLowerCase() || ""
  if (statusLower === "accepted") return <CheckCircle className="h-5 w-5 text-green-600" />
  if (statusLower === "pending" || statusLower === "running") return <Clock className="h-5 w-5 text-yellow-600" />
  if (statusLower.includes("error") || statusLower === "failed") return <XCircle className="h-5 w-5 text-red-600" />
  return <AlertCircle className="h-5 w-5 text-gray-600" />
}

const getStatusBadgeColor = (status: string) => {
  const statusLower = status?.toLowerCase() || ""
  if (statusLower === "accepted") return "bg-green-100 text-green-800 border-green-600"
  if (statusLower === "pending" || statusLower === "running") return "bg-yellow-100 text-yellow-800 border-yellow-600"
  if (statusLower.includes("error") || statusLower === "failed") return "bg-red-100 text-red-800 border-red-600"
  return "bg-gray-100 text-gray-800 border-gray-600"
}

export function SubmissionDetailModal({
  isOpen,
  onClose,
  submission,
  sourceCode,
  isLoadingCode,
  onGradeSuccess
}: SubmissionDetailModalProps) {
  if (!submission) return null

  const finalScore = submission.manual_score ?? submission.cached_score ?? submission.score ?? 0
  const isManuallyGraded = submission.manual_score !== null && submission.manual_score !== undefined

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        <DialogHeader className="border-b-4 border-black pb-4 bg-gradient-to-r from-cyan-400 to-yellow-400 p-4 -mt-6 -mx-6">
          <DialogTitle className="text-2xl font-black uppercase">
            Submission Details
          </DialogTitle>
          <div className="flex items-center gap-4 mt-2">
            <Badge className={`${getStatusBadgeColor(submission.status)} border-2 font-bold uppercase px-3 py-1`}>
              {getStatusIcon(submission.status)}
              <span className="ml-2">{submission.status}</span>
            </Badge>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-700">Score:</span>
              <span className={`text-2xl font-black ${finalScore >= 80 ? 'text-green-600' : finalScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                {finalScore}/100
              </span>
              {isManuallyGraded && (
                <Badge className="bg-purple-100 text-purple-800 border-2 border-purple-600 font-bold">
                  MANUALLY GRADED
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto py-4">
          <Tabs defaultValue="code" className="w-full">
            <TabsList className="grid w-full grid-cols-3 border-4 border-black bg-gray-100">
              <TabsTrigger 
                value="code" 
                className="font-bold uppercase data-[state=active]:bg-cyan-400 data-[state=active]:text-black border-r-4 border-black"
              >
                Source Code
              </TabsTrigger>
              <TabsTrigger 
                value="results" 
                className="font-bold uppercase data-[state=active]:bg-yellow-400 data-[state=active]:text-black border-r-4 border-black"
              >
                Test Results
              </TabsTrigger>
              <TabsTrigger 
                value="grade" 
                className="font-bold uppercase data-[state=active]:bg-pink-400 data-[state=active]:text-black"
              >
                Grade
              </TabsTrigger>
            </TabsList>

            {/* Source Code Tab */}
            <TabsContent value="code" className="mt-4">
              <div className="border-4 border-black bg-gray-900 rounded-lg overflow-hidden">
                {isLoadingCode ? (
                  <div className="flex items-center justify-center p-12">
                    <div className="text-center space-y-2">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-400 border-t-transparent mx-auto"></div>
                      <p className="text-white font-bold">Loading code...</p>
                    </div>
                  </div>
                ) : (
                  <pre className="overflow-auto p-6 text-sm font-mono text-green-400 whitespace-pre-wrap break-words leading-relaxed max-h-96">
                    <code>{sourceCode || 'No code available'}</code>
                  </pre>
                )}
              </div>
            </TabsContent>

            {/* Test Results Tab */}
            <TabsContent value="results" className="mt-4 space-y-4">
              {submission.results && submission.results.length > 0 ? (
                submission.results.map((result, idx) => (
                  <div 
                    key={idx} 
                    className={`border-4 border-black p-4 ${result.status?.toLowerCase() === 'accepted' || result.status?.toLowerCase() === 'passed' ? 'bg-green-50' : 'bg-red-50'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-lg">Test Case #{result.test_case_id || idx + 1}</span>
                      <Badge className={`${getStatusBadgeColor(result.status || 'unknown')} border-2 font-bold uppercase`}>
                        {result.status}
                      </Badge>
                    </div>
                    {result.error_message && (
                      <div className="mt-2 p-3 bg-red-100 border-2 border-red-600">
                        <p className="text-sm font-mono text-red-800">{result.error_message}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                      <div>
                        <span className="font-bold text-gray-700">Time:</span>
                        <span className="ml-2 font-mono">{result.execution_time_ms || 0}ms</span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-700">Memory:</span>
                        <span className="ml-2 font-mono">{result.memory_used_kb || 0}KB</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-12 border-4 border-black bg-gray-50">
                  <p className="text-gray-600 font-bold">No test results available</p>
                </div>
              )}
            </TabsContent>

            {/* Manual Grading Tab */}
            <TabsContent value="grade" className="mt-4">
              <ManualGradingPanel
                submissionId={submission.id}
                currentScore={submission.manual_score}
                currentComment={submission.teacher_comment}
                gradedAt={submission.graded_at}
                onGradeSuccess={() => {
                  if (onGradeSuccess) {
                    onGradeSuccess()
                  }
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
