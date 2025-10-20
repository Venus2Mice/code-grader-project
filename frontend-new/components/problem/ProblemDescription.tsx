"use client"

import { AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Problem } from "@/types/problem"
import type { Submission } from "@/types/submission"

interface ProblemDescriptionProps {
  problem: Problem
  submissions: Submission[]
  onViewSubmission: (submission: any) => void
  getStatusDisplay: (status: string | undefined) => any
  formatVietnameseDate: (dateString: string) => string
}

export function ProblemDescription({
  problem,
  submissions,
  onViewSubmission,
  getStatusDisplay,
  formatVietnameseDate
}: ProblemDescriptionProps) {
  return (
    <div className="p-4 md:p-6">
      <Tabs defaultValue="description">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="description" className="font-black uppercase text-xs md:text-sm">
            DESC
          </TabsTrigger>
          <TabsTrigger value="submissions" className="font-black uppercase text-xs md:text-sm">
            SUBS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="mt-4 md:mt-6 space-y-4 md:space-y-6">
          <div>
            <h2 className="mb-3 text-xl font-black uppercase text-foreground">PROBLEM</h2>
            <div className="prose max-w-none">
              <p className="font-bold text-foreground leading-relaxed">{problem.description}</p>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-black uppercase text-foreground">CONSTRAINTS</h3>
            <ul className="space-y-2 text-sm font-bold text-foreground">
              <li>TIME LIMIT: {problem.time_limit || 1000}MS</li>
              <li>MEMORY LIMIT: {problem.memory_limit ? Math.round(problem.memory_limit / 1024) : 256}MB</li>
              <li>GRADING MODE: {problem.grading_mode?.toUpperCase() || 'STDIO'}</li>
            </ul>
          </div>

          {problem.grading_mode === 'function' && problem.function_signature && (
            <div>
              <h3 className="mb-3 text-lg font-black uppercase text-foreground">FUNCTION SIGNATURE</h3>
              <div className="border-4 border-border bg-accent p-3">
                <pre className="font-mono text-sm text-accent-foreground overflow-x-auto">
                  <code>{problem.function_signature}</code>
                </pre>
              </div>
              <p className="mt-2 text-xs font-bold text-muted-foreground">
                💡 This function template has been loaded into your code editor
              </p>
            </div>
          )}

          <div>
            <h3 className="mb-3 text-lg font-black uppercase text-foreground">TEST CASES</h3>
            <div className="space-y-4">
              {problem.test_cases && problem.test_cases.length > 0 ? (
                problem.test_cases
                  .filter((tc: any) => !tc.is_hidden)
                  .map((testCase: any, index: number) => (
                    <Card 
                      key={testCase.id} 
                      className={`border-4 border-border p-4 ${
                        index % 3 === 0 ? "bg-yellow-100 dark:bg-yellow-950/20" : 
                        index % 3 === 1 ? "bg-pink-100 dark:bg-pink-950/20" : 
                        "bg-blue-100 dark:bg-blue-950/20"
                      }`}
                    >
                      <div className="mb-2 text-sm font-black uppercase text-foreground">
                        TEST CASE {index + 1}
                        {testCase.points > 0 && (
                          <span className="ml-2 text-xs bg-foreground text-background px-2 py-1 rounded">
                            {testCase.points} PTS
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div>
                          <div className="mb-1 text-xs font-black uppercase text-foreground">INPUT:</div>
                          <pre className="border-4 border-border bg-card p-2 text-xs font-mono text-foreground">
                            <code>{testCase.input || "(empty)"}</code>
                          </pre>
                        </div>
                        <div>
                          <div className="mb-1 text-xs font-black uppercase text-foreground">EXPECTED OUTPUT:</div>
                          <pre className="border-4 border-border bg-card p-2 text-xs font-mono text-foreground">
                            <code>{testCase.expected_output || "(empty)"}</code>
                          </pre>
                        </div>
                      </div>
                    </Card>
                  ))
              ) : (
                <div className="text-center py-8 border-4 border-dashed border-border bg-muted">
                  <AlertCircle className="mx-auto mb-3 h-16 w-16 text-muted-foreground" />
                  <p className="font-black uppercase text-foreground">NO TEST CASES AVAILABLE</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="submissions" className="mt-4 md:mt-6 space-y-4">
          {submissions.length > 0 ? (
            submissions.map((submission) => {
              const statusDisplay = getStatusDisplay(submission.status)
              const StatusIcon = statusDisplay.icon

              return (
                <Card key={submission.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`flex items-center gap-1 ${statusDisplay.color} font-black uppercase text-sm`}
                        >
                          <StatusIcon className="h-5 w-5" />
                          <span>{statusDisplay.label}</span>
                        </div>
                        <span className="text-sm font-bold">SCORE: {submission.score || 0}/100</span>
                        <span className="text-sm font-bold">
                          {submission.passedTests || 0}/{submission.totalTests || 0} TESTS
                        </span>
                      </div>
                      <div className="text-xs font-bold text-muted-foreground">
                        {formatVietnameseDate(submission.submittedAt || submission.submitted_at || '')}
                      </div>
                    </div>
                    <button
                      className="inline-flex items-center gap-2 border-4 border-border bg-background px-3 py-2 text-sm font-black uppercase text-foreground transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)]"
                      onClick={() => onViewSubmission(submission)}
                    >
                      VIEW
                    </button>
                  </div>
                </Card>
              )
            })
          ) : (
            <div className="text-center py-8 border-4 border-dashed border-border bg-muted">
              <p className="font-black uppercase text-foreground">NO SUBMISSIONS</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
