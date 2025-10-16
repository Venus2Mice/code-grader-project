"use client"
import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { problemAPI, submissionAPI } from "@/services/api"

export default function TeacherProblemDetailPage() {
  const params = useParams()
  const problemId = params.id as string
  const [problem, setProblem] = useState<any>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [problemId])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [problemResponse, submissionsResponse] = await Promise.all([
        problemAPI.getById(Number(problemId)),
        problemAPI.getSubmissions(Number(problemId))
      ])
      setProblem(problemResponse.data)
      setSubmissions(submissionsResponse.data)
    } catch (err) {
      console.error('Error fetching problem data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
      </div>
    )
  }

  if (!problem) {
    return <div>Problem not found</div>
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "wrong_answer":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "compile_error":
      case "runtime_error":
        return <AlertCircle className="h-5 w-5 text-orange-500" />
      case "time_limit":
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusText = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b-4 border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <Link
            href={`/teacher/class/${problem.class_id}`}
            className="mb-6 inline-flex items-center gap-2 border-4 border-border bg-muted px-4 py-2 font-bold uppercase tracking-wide text-foreground transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
          >
            <ArrowLeft className="h-5 w-5" />
            BACK TO CLASS
          </Link>

          <div className="mt-4">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">{problem.title}</h1>
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  problem.difficulty === "easy"
                    ? "bg-green-500/10 text-green-500"
                    : problem.difficulty === "medium"
                      ? "bg-yellow-500/10 text-yellow-500"
                      : "bg-red-500/10 text-red-500"
                }`}
              >
                {problem.difficulty}
              </span>
            </div>
            <p className="mt-2 text-muted-foreground">{problem.description}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <Tabs defaultValue="submissions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="submissions">All Submissions ({submissions.length})</TabsTrigger>
            <TabsTrigger value="details">Problem Details</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="submissions" className="space-y-4">
            <div className="grid gap-4">
              {submissions.map((submission: any) => {
                const student = submission.user // Backend includes user data in submission
                return (
                  <Card key={submission.id} className="border-border bg-card p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {student?.full_name
                            ?.split(" ")
                            .map((n: string) => n[0])
                            .join("") || "?"}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <p className="font-semibold text-foreground">{student?.full_name}</p>
                            {getStatusIcon(submission.status)}
                            <span className="text-sm text-muted-foreground">{getStatusText(submission.status)}</span>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{student?.email}</p>
                          <div className="mt-3 flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground">
                              Score: <span className="font-semibold text-foreground">{submission.score || 0}/100</span>
                            </span>
                            <span className="text-muted-foreground">
                              Language: {submission.language || 'N/A'}
                            </span>
                            <span className="text-muted-foreground">{new Date(submission.submitted_at).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => window.open(`/submissions/${submission.id}/code`, '_blank')}>
                        View Code
                      </Button>
                    </div>
                  </Card>
                )
              })}

              {submissions.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
                  <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold text-foreground">No submissions yet</h3>
                  <p className="text-sm text-muted-foreground">Students haven't submitted any solutions yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <Card className="border-border bg-card p-6">
              <h2 className="mb-4 text-xl font-semibold text-foreground">Problem Configuration</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Time Limit</p>
                    <p className="mt-1 text-sm text-muted-foreground">{problem.time_limit}ms</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Memory Limit</p>
                    <p className="mt-1 text-sm text-muted-foreground">{Math.round(problem.memory_limit / 1024)}MB</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Grading Mode</p>
                    <p className="mt-1 text-sm text-muted-foreground">{problem.grading_mode}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Test Cases</p>
                    <p className="mt-1 text-sm text-muted-foreground">{problem.test_cases?.length || 0} cases</p>
                  </div>
                </div>

                {problem.function_signature && (
                  <div>
                    <p className="text-sm font-medium text-foreground">Function Signature</p>
                    <pre className="mt-2 rounded-lg bg-muted p-3 text-sm text-foreground">
                      {problem.function_signature}
                    </pre>
                  </div>
                )}

                <div>
                  <p className="mb-3 text-sm font-medium text-foreground">Test Cases</p>
                  <div className="space-y-2">
                    {problem.test_cases?.map((testCase: any, index: number) => (
                      <Card key={testCase.id} className="border-border bg-muted/50 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-foreground">Test Case {index + 1}</p>
                              {testCase.isHidden && (
                                <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-500">
                                  Hidden
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">{testCase.points} points</span>
                            </div>
                            <div className="mt-2 grid gap-2 text-xs">
                              <div>
                                <span className="font-medium text-foreground">Input:</span>
                                <pre className="mt-1 rounded bg-background p-2 text-muted-foreground">
                                  {testCase.input}
                                </pre>
                              </div>
                              <div>
                                <span className="font-medium text-foreground">Expected Output:</span>
                                <pre className="mt-1 rounded bg-background p-2 text-muted-foreground">
                                  {testCase.expectedOutput}
                                </pre>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="statistics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-border bg-card p-6">
                <p className="text-sm font-medium text-muted-foreground">Total Submissions</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{submissions.length}</p>
              </Card>
              <Card className="border-border bg-card p-6">
                <p className="text-sm font-medium text-muted-foreground">Accepted</p>
                <p className="mt-2 text-3xl font-bold text-green-500">
                  {submissions.filter((s) => s.status === "accepted").length}
                </p>
              </Card>
              <Card className="border-border bg-card p-6">
                <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                <p className="mt-2 text-3xl font-bold text-foreground">
                  {submissions.length > 0
                    ? Math.round(submissions.reduce((acc, s) => acc + s.score, 0) / submissions.length)
                    : 0}
                </p>
              </Card>
            </div>

            <Card className="border-border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">Submission Status Breakdown</h3>
              <div className="space-y-3">
                {["accepted", "wrong_answer", "compile_error", "runtime_error", "time_limit"].map((status) => {
                  const count = submissions.filter((s) => s.status === status).length
                  const percentage = submissions.length > 0 ? (count / submissions.length) * 100 : 0
                  return (
                    <div key={status}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-foreground">{getStatusText(status)}</span>
                        <span className="text-muted-foreground">
                          {count} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full ${
                            status === "accepted"
                              ? "bg-green-500"
                              : status === "wrong_answer"
                                ? "bg-red-500"
                                : "bg-orange-500"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
