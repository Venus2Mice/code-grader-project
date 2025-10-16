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
  
  // Store classId from URL search params or localStorage as fallback
  const [classId, setClassId] = useState<string | null>(null)
  
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
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)

  // Get classId from URL params or localStorage
  useEffect(() => {
    // Try to get from URL search params first
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const classIdFromUrl = urlParams.get('classId')
      
      if (classIdFromUrl) {
        setClassId(classIdFromUrl)
        // Save to localStorage for future use
        localStorage.setItem(`problem_${problemId}_classId`, classIdFromUrl)
      } else {
        // Fallback to localStorage
        const savedClassId = localStorage.getItem(`problem_${problemId}_classId`)
        if (savedClassId) {
          setClassId(savedClassId)
        }
      }
    }
  }, [problemId])

  useEffect(() => {
    fetchProblemData()
  }, [problemId])

  const fetchProblemData = async () => {
    try {
      setIsLoading(true)
      const response = await problemAPI.getById(Number(problemId))
      const problemData = response.data
      setProblem(problemData)
      
      // Store classId if available from API response
      if (problemData.class_id) {
        setClassId(String(problemData.class_id))
        localStorage.setItem(`problem_${problemId}_classId`, String(problemData.class_id))
      }
      
      // Fetch user's submissions for this problem
      const subsResponse = await submissionAPI.getMySubmissions(Number(problemId))
      setSubmissions(subsResponse.data)
    } catch (err) {
      console.error('Error fetching problem:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRun = async () => {
    setIsRunning(true)
    setTestResults(null)
    try {
      const response = await submissionAPI.runCode({
        problem_id: Number(problemId),
        source_code: code,
        language: language
      })
      
      const submissionId = response.data.submission_id
      
      // Show running status
      setTestResults({
        status: "running",
        message: "Running your code...",
        isTest: true
      })
      
      // Poll for results every 2 seconds
      const pollInterval = setInterval(async () => {
        try {
          const resultResponse = await submissionAPI.getById(submissionId)
          const submissionData = resultResponse.data
          
          // Check if grading is complete
          if (submissionData.status !== 'Pending' && submissionData.status !== 'Running') {
            clearInterval(pollInterval)
            setIsRunning(false)
            
            // Display results
            setTestResults({
              status: submissionData.status === 'Completed' ? 'accepted' : 'error',
              message: submissionData.status,
              isTest: true,
              score: submissionData.score || 0,
              passedTests: submissionData.passed_tests || 0,
              totalTests: submissionData.total_tests || 0,
              results: submissionData.results || []
            })
          }
        } catch (pollErr) {
          console.error('Error polling results:', pollErr)
          clearInterval(pollInterval)
          setIsRunning(false)
          setTestResults({
            status: "error",
            message: "Failed to get test results",
            isTest: true
          })
        }
      }, 2000) // Poll every 2 seconds
      
      // Stop polling after 30 seconds (timeout)
      setTimeout(() => {
        clearInterval(pollInterval)
        if (isRunning) {
          setIsRunning(false)
          setTestResults({
            status: "error",
            message: "Test timeout - please try again",
            isTest: true
          })
        }
      }, 30000)
      
    } catch (err: any) {
      console.error('Error running code:', err)
      setTestResults({
        status: "error",
        message: err.response?.data?.msg || 'Failed to run code',
        isTest: true
      })
      setIsRunning(false)
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
        message: "Submission queued for grading",
        isTest: false
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

  const getStatusDisplay = (status: string | undefined) => {
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
        return { icon: Clock, color: "text-muted-foreground", bg: "bg-muted", label: "Pending" }
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
            {classId ? (
              <Link
                href={`/student/class/${classId}`}
                className="inline-flex items-center gap-2 text-xs md:text-sm font-black uppercase hover:text-brutal-accent"
              >
                <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">BACK</span>
              </Link>
            ) : (
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-xs md:text-sm font-black uppercase hover:text-brutal-accent"
              >
                <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">BACK</span>
              </Button>
            )}
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
            <Select value={language} onValueChange={setLanguage} disabled>
              <SelectTrigger className="w-24 md:w-32 font-black uppercase text-xs md:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cpp">C++</SelectItem>
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
              variant="outline"
              onClick={handleRun}
              disabled={isRunning || isSubmitting}
              className="gap-2 font-black uppercase text-xs md:text-sm bg-brutal-yellow hover:bg-brutal-yellow/80"
            >
              <Play className="h-4 w-4 md:h-5 md:w-5" />
              {isRunning ? "RUNNING..." : "RUN"}
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || isRunning}
              className="gap-2 font-black uppercase text-xs md:text-sm"
            >
              <CheckCircle className="h-4 w-4 md:h-5 md:w-5" />
              {isSubmitting ? "SUBMITTING..." : "SUBMIT"}
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
                              <span className="text-sm font-bold">SCORE: {submission.score || 0}/100</span>
                              <span className="text-sm font-bold">
                                {submission.passedTests || 0}/{submission.totalTests || 0} TESTS
                              </span>
                            </div>
                            <div className="text-xs font-bold text-muted-foreground">
                              {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'N/A'}
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
                <h3 className="font-black uppercase text-foreground">
                  {testResults.isTest ? "TEST RESULTS" : "SUBMISSION RESULTS"}
                </h3>
                <div
                  className={`flex items-center gap-2 font-black uppercase text-foreground ${
                    testResults.status === "accepted" 
                      ? "text-green-600" 
                      : testResults.status === "running" || testResults.status === "pending"
                        ? "text-blue-600"
                        : testResults.status === "info"
                          ? "text-yellow-600"
                          : "text-red-600"
                  }`}
                >
                  {testResults.status === "accepted" ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : testResults.status === "running" || testResults.status === "pending" ? (
                    <Clock className="h-6 w-6 animate-spin" />
                  ) : testResults.status === "info" ? (
                    <AlertCircle className="h-6 w-6" />
                  ) : (
                    <XCircle className="h-6 w-6" />
                  )}
                  <span>
                    {testResults.passedTests !== undefined && testResults.totalTests !== undefined
                      ? `${testResults.passedTests}/${testResults.totalTests} PASSED - ${testResults.score || 0}/100`
                      : testResults.message || testResults.status.toUpperCase()
                    }
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {testResults.results && Array.isArray(testResults.results) && testResults.results.length > 0 ? (
                  testResults.results.map((result: any, index: number) => (
                    <Card
                      key={result.test_case_id || index}
                      className={`border-4 p-3 ${
                        result.status === "Passed" ? "border-green-600 bg-green-100" : "border-red-600 bg-red-100"
                      }`}
                    >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black uppercase text-foreground">TEST CASE #{result.test_case_id}</span>
                        <span
                          className={`text-xs font-black uppercase text-foreground ${result.status === "Passed" ? "text-green-600" : "text-red-600"}`}
                        >
                          {result.status}
                        </span>
                      </div>
                      {result.status === "Passed" && (
                        <div className="text-xs font-bold text-muted-foreground">
                          {result.execution_time_ms}MS | {Math.round(result.memory_used_kb / 1024)}MB
                        </div>
                      )}
                    </div>

                    {result.status !== "Passed" && (
                      <div className="mt-2 space-y-2 text-xs">
                        {result.output_received && (
                          <div>
                            <div className="font-black uppercase mb-1 text-foreground">YOUR OUTPUT:</div>
                            <pre className="bg-background border-2 border-red-600 p-2 text-red-600 font-mono whitespace-pre-wrap">
                              {result.output_received}
                            </pre>
                          </div>
                        )}
                        {result.error_message && (
                          <div>
                            <div className="font-black uppercase mb-1 text-foreground">ERROR:</div>
                            <pre className="bg-background border-2 border-red-600 p-2 text-red-600 font-mono whitespace-pre-wrap">
                              {result.error_message}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                  ))
                ) : testResults.status === "running" || testResults.status === "pending" ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    <Clock className="mx-auto mb-2 h-8 w-8 animate-spin text-blue-600" />
                    <p className="font-bold">{testResults.message}</p>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No test results available</div>
                )}
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
                          {submission.language?.toUpperCase() || 'CPP'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-1">
                        <span>Score: {submission.score || 0}/100</span>
                        <span>
                          {submission.passedTests || 0}/{submission.totalTests || 0} tests passed
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'N/A'}
                      </div>
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
