import { useState } from "react"
import { CheckCircle, XCircle, Clock, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import CodeQualityReport from "@/components/CodeQualityReport"
import type { SubmissionResult } from "@/types"

interface TestResultsPanelProps {
  testResults: SubmissionResult | null
  onViewErrorDetails?: (errorMessage: string, testCaseId: number) => void
}

export function TestResultsPanel({ testResults, onViewErrorDetails }: TestResultsPanelProps) {
  const [activeTab, setActiveTab] = useState<'results' | 'quality'>('results')
  // Global expand/collapse for the whole results section
  const [sectionExpanded, setSectionExpanded] = useState<boolean>(true)

  if (!testResults) return null

  // Show code quality whenever backend returns it (for run + submit)
  const hasQualityReport = !!testResults.codeQuality

  return (
    <div className="border-t-4 border-border bg-card p-2 md:p-4">
      {/* Header with Tabs */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black uppercase text-foreground">
            {testResults.isTest ? "TEST RESULTS" : "SUBMISSION RESULTS"}
          </h3>
          {/* Global expand/collapse toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSectionExpanded(prev => !prev)}
            className="font-black uppercase text-xs"
          >
            {sectionExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" /> Collapse Section
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" /> Expand Section
              </>
            )}
          </Button>
          <div
            className={`flex items-center gap-2 font-black uppercase ${
              testResults.status === "Accepted" 
                ? "text-green-600 dark:text-green-400" 
                : testResults.status === "Running" || testResults.status === "Pending"
                  ? "text-blue-600 dark:text-blue-400"
                  : testResults.status === "info"
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-red-600 dark:text-red-400"
            }`}
          >
            {testResults.status === "Accepted" ? (
              <CheckCircle className="h-6 w-6" />
            ) : testResults.status === "Running" || testResults.status === "Pending" ? (
              <Clock className="h-6 w-6 animate-spin" />
            ) : testResults.status === "info" ? (
              <AlertCircle className="h-6 w-6" />
            ) : (
              <XCircle className="h-6 w-6" />
            )}
            <span>
              {(testResults.passed_tests !== undefined && testResults.total_tests !== undefined)
                ? `${testResults.passed_tests}/${testResults.total_tests} PASSED - ${testResults.score || 0}/100`
                : testResults.message || testResults.status.toUpperCase()
              }
            </span>
          </div>
        </div>

        {/* Tabs - Neo Brutalism Style */}
        {hasQualityReport && (
          <div className="flex gap-2 mb-4 border-b-4 border-border">
            <button
              onClick={() => setActiveTab('results')}
              className={`px-4 py-2 font-black uppercase border-4 border-b-0 transition-all ${
                activeTab === 'results'
                  ? 'bg-background border-border translate-y-1'
                  : 'bg-muted border-transparent hover:bg-muted/80'
              }`}
            >
              🧪 Test Results
            </button>
            <button
              onClick={() => setActiveTab('quality')}
              className={`px-4 py-2 font-black uppercase border-4 border-b-0 transition-all ${
                activeTab === 'quality'
                  ? 'bg-background border-border translate-y-1'
                  : 'bg-muted border-transparent hover:bg-muted/80'
              }`}
            >
              📊 Code Quality
            </button>
          </div>
        )}
      </div>

      {/* Tab Content - fully hidden when sectionCollapsed */}
      {sectionExpanded && (
        <div className="max-h-[600px] overflow-y-auto">
        {activeTab === 'results' && (
          <>
            {/* Results list */}
            <div className="space-y-2">{((testResults.test_results || testResults.results) && Array.isArray(testResults.test_results || testResults.results) && (testResults.test_results || testResults.results)!.length > 0) ? (
          (testResults.test_results || testResults.results)!
            .filter((result: any) => {
              if (result.test_case_id === null || result.test_case_id === undefined) return true
              return result.is_hidden === false
            })
            .map((result: any, index: number) => {
              const rawStatus = String(result.status || '')
              const statusNorm = rawStatus.toLowerCase()
              const isPassed = ['passed', 'accepted', 'ok', 'success'].includes(statusNorm)
              const isCompileError = statusNorm.includes('compile') || result.test_case_id === null || result.test_case_id === undefined

              const cardClass = isPassed
                ? 'border-green-600 dark:border-green-500 bg-green-100 dark:bg-green-950/30'
                : isCompileError
                  ? 'border-orange-600 dark:border-orange-500 bg-orange-100 dark:bg-orange-950/30'
                  : 'border-red-600 dark:border-red-500 bg-red-100 dark:bg-red-950/30'

              const labelClass = isPassed 
                ? 'text-green-600 dark:text-green-400' 
                : (isCompileError ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400')

              return (
                <Card
                  key={result.test_case_id ?? `error-${index}`}
                  className={`border-4 ${cardClass}`}
                >
                  {/* Header - Always Visible */}
                  <div className="w-full p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isCompileError ? (
                        <>
                          <AlertCircle className="h-5 w-5 text-orange-600" />
                          <span className="text-sm font-black uppercase text-foreground">COMPILATION ERROR</span>
                        </>
                      ) : (
                        <>
                          <span className="text-sm font-black uppercase text-foreground">
                            TEST CASE #{result.test_case_id}
                          </span>
                          <span className={`text-xs font-black uppercase text-foreground ${labelClass}`}>
                            {isPassed ? 'ACCEPTED' : rawStatus}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isPassed && (
                        <div className="text-xs font-bold text-muted-foreground">
                          {result.execution_time_ms}MS | {Math.round((result.memory_used_kb || 0) / 1024)}MB
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Details (visible when section is expanded) */}
                  <div className="px-3 pb-3 border-t-2 border-border/50 pt-3">
                  {!isCompileError && (
                    <div className="space-y-2 text-xs">
                      {!statusNorm.includes('runtime') && 
                       !statusNorm.includes('time limit') && 
                       !statusNorm.includes('memory limit') && 
                       !statusNorm.includes('output limit') && 
                       result.output_received && 
                       result.output_received.trim() !== '' && (
                        <div>
                          <div className="font-black uppercase mb-1 text-foreground">YOUR OUTPUT:</div>
                          <pre className={`bg-background border-2 p-2 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto ${
                            isPassed ? 'border-green-600 text-green-600' : 'border-red-600 text-red-600'
                          }`}>
                            {result.output_received}
                          </pre>
                        </div>
                      )}
                      {!statusNorm.includes('runtime') && 
                       !statusNorm.includes('time limit') && 
                       !statusNorm.includes('memory limit') && 
                       !statusNorm.includes('output limit') && 
                       result.expected_output && (
                        <div>
                          <div className="font-black uppercase mb-1 text-foreground">EXPECTED OUTPUT:</div>
                          <pre className="bg-background border-2 border-green-600 p-2 text-green-600 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                            {typeof result.expected_output === 'object' && result.expected_output.value !== undefined
                              ? JSON.stringify(result.expected_output.value)
                              : result.expected_output}
                          </pre>
                        </div>
                      )}
                      {!isPassed && result.error_message && (
                        <div>
                          <div className="font-black uppercase mb-1 text-foreground">ERROR:</div>
                          <pre className="bg-background border-2 border-red-600 p-2 text-red-600 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                            {result.error_message}
                          </pre>
                          {(statusNorm.includes('runtime') || 
                            statusNorm.includes('time limit') || 
                            statusNorm.includes('memory limit') || 
                            statusNorm.includes('output limit')) && onViewErrorDetails && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 gap-2 font-black uppercase text-xs"
                              onClick={() => onViewErrorDetails(result.error_message, result.test_case_id)}
                            >
                              <AlertCircle className="h-4 w-4" />
                              VIEW DETAILS & SUGGESTIONS
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                    {isCompileError && result.error_message && (
                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="font-black uppercase mb-1 text-foreground">ERROR:</div>
                        <pre className="bg-background border-2 border-red-600 p-2 text-red-600 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                          {result.error_message}
                        </pre>
                        {onViewErrorDetails && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 gap-2 font-black uppercase text-xs"
                            onClick={() => onViewErrorDetails(result.error_message, result.test_case_id)}
                          >
                            <AlertCircle className="h-4 w-4" />
                            VIEW FULL ERROR
                          </Button>
                        )}
                      </div>
                    </div>
                    )}
                    </div>
                  </Card>
              )
            })
        ) : testResults.status === "Running" || testResults.status === "Pending" ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            <Clock className="mx-auto mb-2 h-8 w-8 animate-spin text-blue-600" />
            <p className="font-bold">{testResults.message}</p>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No test results available</div>
        )}
            </div>
          </>
        )}

        {/* Quality Tab Content */}
        {activeTab === 'quality' && hasQualityReport && (
          <CodeQualityReport codeQuality={testResults.codeQuality!} />
        )}
      </div>
      )}
    </div>
  )
}
