"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Play, History, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CodeEditor } from "@/components/code-editor"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { problemAPI, submissionAPI } from "@/services/api"

export default function ProblemSolvePage() {
  const params = useParams()
  const router = useRouter()
  const problemId = params.id as string
  const [problem, setProblem] = useState<any>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null)

  const [code, setCode] = useState(`#include <iostream>
#include <vector>
using namespace std;

int main() {
    // Write your solution here
    
    return 0;
}`)

  const [language, setLanguage] = useState("cpp")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)

  useEffect(() => {
    fetchProblemData()
  }, [problemId])

  const fetchProblemData = async () => {
    try {
      setIsLoading(true)
      const response = await problemAPI.getById(Number(problemId))
      setProblem(response.data)
      
      // Fetch user's submissions for this problem
      const subsResponse = await submissionAPI.getMySubmissions(Number(problemId))
      setSubmissions(subsResponse.data)
    } catch (err) {
      console.error('Error fetching problem:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const response = await submissionAPI.create({
        problem_id: Number(problemId),
        source_code: code,
        language: language
      })
      
      // Poll for results or show success
      setTestResults({
        status: "pending",
        message: "Submission queued for grading"
      })
      
      // Refresh submissions list
      await fetchProblemData()
    } catch (err: any) {
      console.error('Error submitting code:', err)
      alert(err.response?.data?.msg || 'Failed to submit code')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "accepted":
        return { icon: CheckCircle, color: "text-green-600", bg: "bg-green-100", label: "Accepted" }
      case "wrong_answer":
        return { icon: XCircle, color: "text-red-600", bg: "bg-red-100", label: "Wrong Answer" }
      case "compile_error":
        return { icon: AlertCircle, color: "text-orange-500", bg: "bg-orange-500/10", label: "Compile Error" }
      case "time_limit":
        return { icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10", label: "Time Limit" }
      default:
        return { icon: Clock, color: "text-muted-foreground", bg: "bg-muted", label: "Running" }
    }
  }

  const viewSubmission = async (submission: any) => {
    setSelectedSubmission(submission)
    // Fetch the code for this submission
    try {
      const codeResponse = await submissionAPI.getCode(submission.id)
      setCode(codeResponse.data.source_code)
      setLanguage(submission.language || 'cpp')
    } catch (err) {
      console.error('Error fetching submission code:', err)
    }
    setIsHistoryOpen(false)
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-brutal-bg">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
      </div>
    )
  }

  if (!problem) {
    return <div>Problem not found</div>
  }

  return (
    <div className="flex h-screen flex-col bg-brutal-bg">
      {/* Header */}
      <div className="border-b-4 border-black bg-background">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-4 md:px-6 py-4">
          <div className="flex items-center gap-2 md:gap-4 flex-wrap">
            <Link
              href={`/student/class/${problem.class_id}`}
              className="inline-flex items-center gap-2 text-xs md:text-sm font-black uppercase hover:text-brutal-accent"
            >
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">BACK</span>
            </Link>
            <div className="hidden md:block h-8 w-1 bg-foreground" />
            <h1 className="text-sm md:text-lg font-black uppercase text-foreground line-clamp-1">{problem.title}</h1>
            <span
              className={`border-4 border-black px-2 md:px-3 py-1 text-xs font-black uppercase ${
                problem.difficulty === "easy"
                  ? "bg-green-400"
                  : problem.difficulty === "medium"
                    ? "bg-yellow-400"
                    : "bg-red-400"
              }`}
            >
              {problem.difficulty}
            </span>
          </div>

          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-24 md:w-32 font-black uppercase text-xs md:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cpp">C++</SelectItem>
                <SelectItem value="c">C</SelectItem>
                <SelectItem value="python">PYTHON</SelectItem>
                <SelectItem value="java">JAVA</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="gap-2 font-black uppercase bg-transparent text-xs md:text-sm"
              onClick={() => setIsHistoryOpen(true)}
            >
              <History className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">HISTORY ({submissions.length})</span>
              <span className="sm:hidden">({submissions.length})</span>
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="gap-2 font-black uppercase text-xs md:text-sm"
            >
              <Play className="h-4 w-4 md:h-5 md:w-5" />
              {isSubmitting ? "RUN..." : "SUBMIT"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Left Panel - Problem Description */}
        <div className="lg:w-1/2 overflow-y-auto border-b-4 lg:border-b-0 lg:border-r-4 border-black bg-background max-h-[40vh] lg:max-h-none">
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
                    <li>TIME LIMIT: {problem.time_limit}MS</li>
                    <li>MEMORY LIMIT: {Math.round(problem.memory_limit / 1024)}MB</li>
                    <li>GRADING MODE: {problem.grading_mode}</li>
                    {problem.function_signature && (
                      <li className="font-mono text-xs border-4 border-black bg-brutal-accent p-2 text-black">
                        {problem.function_signature}
                      </li>
                    )}
                  </ul>
                </div>

                <div>
                  <h3 className="mb-3 text-lg font-black uppercase text-foreground">TEST CASES</h3>
                  <div className="space-y-4">
                    <Card className="border-4 border-black bg-brutal-yellow/30 p-4">
                      <div className="mb-2 text-sm font-black uppercase text-foreground">TEST CASE 1</div>
                      <div className="space-y-2">
                        <div>
                          <div className="mb-1 text-xs font-black uppercase text-foreground">INPUT:</div>
                          <pre className="border-4 border-black bg-background p-2 text-xs font-mono text-foreground">
                            <code>5 10{"\n"}1 2 3 4 5</code>
                          </pre>
                        </div>
                        <div>
                          <div className="mb-1 text-xs font-black uppercase text-foreground">OUTPUT:</div>
                          <pre className="border-4 border-black bg-background p-2 text-xs font-mono text-foreground">
                            <code>3 4</code>
                          </pre>
                        </div>
                      </div>
                    </Card>

                    <Card className="border-4 border-black bg-brutal-pink/30 p-4">
                      <div className="mb-2 text-sm font-black uppercase text-foreground">TEST CASE 2</div>
                      <div className="space-y-2">
                        <div>
                          <div className="mb-1 text-xs font-black uppercase text-foreground">INPUT:</div>
                          <pre className="border-4 border-black bg-background p-2 text-xs font-mono text-foreground">
                            <code>3 6{"\n"}1 2 3</code>
                          </pre>
                        </div>
                        <div>
                          <div className="mb-1 text-xs font-black uppercase text-foreground">OUTPUT:</div>
                          <pre className="border-4 border-black bg-background p-2 text-xs font-mono text-foreground">
                            <code>-1</code>
                          </pre>
                        </div>
                      </div>
                    </Card>
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
                              <span className="text-sm font-bold">SCORE: {submission.score}/100</span>
                              <span className="text-sm font-bold">
                                {submission.passedTests}/{submission.totalTests} TESTS
                              </span>
                            </div>
                            <div className="text-xs font-bold text-muted-foreground">
                              {submission.submittedAt.toLocaleString()}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewSubmission(submission)}
                            className="font-black uppercase"
                          >
                            VIEW
                          </Button>
                        </div>
                      </Card>
                    )
                  })
                ) : (
                  <div className="text-center py-8 border-4 border-dashed border-black bg-background">
                    <History className="mx-auto mb-3 h-16 w-16 text-foreground" />
                    <p className="font-black uppercase text-foreground">NO SUBMISSIONS</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right Panel - Code Editor */}
        <div className="flex lg:w-1/2 flex-col bg-background flex-1">
          <div className="flex-1 overflow-hidden border-4 border-black m-2 md:m-4">
            <CodeEditor value={code} onChange={setCode} language={language} />
          </div>

          {testResults && (
            <div className="border-t-4 border-black bg-background p-2 md:p-4 max-h-48 md:max-h-64 overflow-y-auto">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-black uppercase text-foreground">RESULTS</h3>
                <div
                  className={`flex items-center gap-2 font-black uppercase text-foreground ${testResults.status === "accepted" ? "text-green-600" : "text-red-600"}`}
                >
                  {testResults.status === "accepted" ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <XCircle className="h-6 w-6" />
                  )}
                  <span>
                    {testResults.passedTests}/{testResults.totalTests} PASSED - {testResults.score}/100
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {testResults.results.map((result: any) => (
                  <Card
                    key={result.id}
                    className={`border-4 p-3 ${
                      result.status === "passed" ? "border-green-600 bg-green-100" : "border-red-600 bg-red-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black uppercase text-foreground">TEST {result.id}</span>
                        <span
                          className={`text-xs font-black uppercase text-foreground ${result.status === "passed" ? "text-green-600" : "text-red-600"}`}
                        >
                          {result.status === "passed" ? "PASSED" : "FAILED"}
                        </span>
                      </div>
                      {result.status === "passed" && (
                        <div className="text-xs font-bold text-muted-foreground">
                          {result.time}MS | {result.memory}MB
                        </div>
                      )}
                    </div>

                    {result.status === "failed" && (
                      <div className="mt-2 space-y-2 text-xs">
                        <div>
                          <div className="font-black uppercase mb-1 text-foreground">INPUT:</div>
                          <pre className="bg-background border-2 border-black p-2 font-mono text-foreground">
                            {result.input}
                          </pre>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="font-black uppercase mb-1 text-foreground">YOUR OUTPUT:</div>
                            <pre className="bg-background border-2 border-red-600 p-2 text-red-600 font-mono">
                              {result.output}
                            </pre>
                          </div>
                          <div>
                            <div className="font-black uppercase mb-1 text-foreground">EXPECTED:</div>
                            <pre className="bg-background border-2 border-green-600 p-2 text-green-600 font-mono">
                              {result.expected}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submission History</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {submissions.map((submission) => {
              const statusDisplay = getStatusDisplay(submission.status)
              const StatusIcon = statusDisplay.icon

              return (
                <Card key={submission.id} className="border-border bg-card p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`flex items-center gap-1 ${statusDisplay.color}`}>
                          <StatusIcon className="h-4 w-4" />
                          <span className="font-semibold text-sm text-foreground">{statusDisplay.label}</span>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${statusDisplay.bg} ${statusDisplay.color}`}
                        >
                          {submission.language.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-1">
                        <span>Score: {submission.score}/100</span>
                        <span>
                          {submission.passedTests}/{submission.totalTests} tests passed
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">{submission.submittedAt.toLocaleString()}</div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => viewSubmission(submission)}>
                      Load Code
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
