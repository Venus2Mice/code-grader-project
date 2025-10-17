"use client"
import { useParams } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, XCircle, Clock, AlertCircle, Filter, Table as TableIcon, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { problemAPI, submissionAPI } from "@/services/api"

export default function TeacherProblemDetailPage() {
  const params = useParams()
  const problemId = params.id as string
  const [problem, setProblem] = useState<any>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grouped' | 'table'>('grouped')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'latest' | 'score' | 'name'>('latest')

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

  // Group submissions by student (show best submission for each student)
  const groupedSubmissions = useMemo(() => {
    const studentMap = new Map<number, any>()
    
    submissions.forEach(submission => {
      const studentId = submission.user?.id
      if (!studentId) return
      
      const existing = studentMap.get(studentId)
      if (!existing || submission.score > existing.score || 
          (submission.score === existing.score && new Date(submission.submittedAt || submission.submitted_at) > new Date(existing.submittedAt || existing.submitted_at))) {
        studentMap.set(studentId, {
          ...submission,
          allSubmissions: submissions.filter(s => s.user?.id === studentId)
        })
      }
    })
    
    return Array.from(studentMap.values())
  }, [submissions])

  // Filter and sort submissions
  const filteredAndSortedSubmissions = useMemo(() => {
    let filtered = viewMode === 'grouped' ? groupedSubmissions : submissions
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(s => s.status?.toLowerCase() === filterStatus.toLowerCase())
    }
    
    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return (b.score || 0) - (a.score || 0)
        case 'name':
          return (a.user?.full_name || '').localeCompare(b.user?.full_name || '')
        case 'latest':
        default:
          return new Date(b.submittedAt || b.submitted_at).getTime() - new Date(a.submittedAt || a.submitted_at).getTime()
      }
    })
    
    return filtered
  }, [viewMode, groupedSubmissions, submissions, filterStatus, sortBy])

  // Calculate statistics
  const stats = useMemo(() => {
    const total = groupedSubmissions.length
    const accepted = groupedSubmissions.filter(s => s.status?.toLowerCase() === 'accepted').length
    const avgScore = groupedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / (total || 1)
    
    return {
      totalStudents: total,
      acceptedCount: accepted,
      acceptanceRate: total > 0 ? ((accepted / total) * 100).toFixed(1) : '0',
      averageScore: avgScore.toFixed(1)
    }
  }, [groupedSubmissions])

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
    const normalizedStatus = status?.toLowerCase()
    
    switch (normalizedStatus) {
      case "accepted":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "wrong_answer":
      case "wrong answer":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "compile_error":
      case "compile error":
      case "runtime_error":
      case "runtime error":
        return <AlertCircle className="h-5 w-5 text-orange-500" />
      case "time_limit":
      case "time limit exceeded":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "pending":
      case "running":
        return <Clock className="h-5 w-5 text-blue-500" />
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusText = (status: string) => {
    if (!status) return "Unknown"
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  // Format date to Vietnam timezone
  const formatVietnameseDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
    } catch (err) {
      return 'N/A'
    }
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
            BACK
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
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-4 border-border p-4">
            <p className="text-sm font-bold text-muted-foreground uppercase">Total Students</p>
            <p className="text-3xl font-black text-foreground mt-2">{stats.totalStudents}</p>
          </Card>
          <Card className="border-4 border-border p-4">
            <p className="text-sm font-bold text-muted-foreground uppercase">Accepted</p>
            <p className="text-3xl font-black text-green-600 mt-2">{stats.acceptedCount}</p>
          </Card>
          <Card className="border-4 border-border p-4">
            <p className="text-sm font-bold text-muted-foreground uppercase">Acceptance Rate</p>
            <p className="text-3xl font-black text-foreground mt-2">{stats.acceptanceRate}%</p>
          </Card>
          <Card className="border-4 border-border p-4">
            <p className="text-sm font-bold text-muted-foreground uppercase">Avg Score</p>
            <p className="text-3xl font-black text-foreground mt-2">{stats.averageScore}</p>
          </Card>
        </div>

        {/* Filters and View Toggle */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant={viewMode === 'grouped' ? 'default' : 'outline'}
              onClick={() => setViewMode('grouped')}
              className="font-bold uppercase"
            >
              <Users className="h-4 w-4 mr-2" />
              By Student
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              onClick={() => setViewMode('table')}
              className="font-bold uppercase"
            >
              <TableIcon className="h-4 w-4 mr-2" />
              All Submissions
            </Button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px] font-bold">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="wrong answer">Wrong Answer</SelectItem>
                  <SelectItem value="compile error">Compile Error</SelectItem>
                  <SelectItem value="runtime error">Runtime Error</SelectItem>
                  <SelectItem value="time limit exceeded">Time Limit</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-[180px] font-bold">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest First</SelectItem>
                <SelectItem value="score">Highest Score</SelectItem>
                <SelectItem value="name">Student Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="submissions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="submissions">
              Submissions ({viewMode === 'grouped' ? stats.totalStudents : submissions.length})
            </TabsTrigger>
            <TabsTrigger value="details">Problem Details</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="submissions" className="space-y-4">
            {viewMode === 'grouped' ? (
              /* Grouped View - By Student */
              <div className="grid gap-4">
                {filteredAndSortedSubmissions.length > 0 ? (
                  filteredAndSortedSubmissions.map((submission: any) => {
                    const student = submission.user
                    const allSubmissionsCount = submission.allSubmissions?.length || 1
                    
                    return (
                      <Card key={submission.id} className="border-4 border-border bg-card p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary border-2 border-border">
                              {student?.full_name
                                ?.split(" ")
                                .map((n: string) => n[0])
                                .join("") || "?"}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 flex-wrap">
                                <p className="font-bold text-lg text-foreground">{student?.full_name || 'Unknown'}</p>
                                <Badge variant={submission.status?.toLowerCase() === 'accepted' ? 'default' : 'secondary'} className="font-bold uppercase">
                                  {allSubmissionsCount} {allSubmissionsCount === 1 ? 'Submission' : 'Submissions'}
                                </Badge>
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">{student?.email}</p>
                              
                              <div className="mt-4 flex items-center gap-6 flex-wrap">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(submission.status)}
                                  <span className="text-sm font-bold text-foreground">{getStatusText(submission.status)}</span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Best Score: </span>
                                  <span className={`font-black ${submission.score >= 80 ? 'text-green-600' : submission.score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {submission.score || 0}/100
                                  </span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Tests: </span>
                                  <span className="font-bold text-foreground">
                                    {submission.passedTests || submission.passed_tests || 0}/{submission.totalTests || submission.total_tests || 0}
                                  </span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Language: </span>
                                  <span className="font-bold text-foreground uppercase">{submission.language || 'CPP'}</span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Latest: {formatVietnameseDate(submission.submittedAt || submission.submitted_at)}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="font-bold uppercase"
                              onClick={() => {
                                // TODO: Show modal with all submissions for this student
                                alert(`View all ${allSubmissionsCount} submissions for ${student?.full_name}`)
                              }}
                            >
                              View All ({allSubmissionsCount})
                            </Button>
                            <Button 
                              variant="default" 
                              size="sm"
                              className="font-bold uppercase"
                              onClick={() => window.open(`/submissions/${submission.id}/code`, '_blank')}
                            >
                              View Best Code
                            </Button>
                          </div>
                        </div>
                      </Card>
                    )
                  })
                ) : (
                  <Card className="border-4 border-border p-12 text-center">
                    <Users className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                    <p className="font-bold text-lg text-foreground uppercase">No Submissions Found</p>
                    <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters</p>
                  </Card>
                )}
              </div>
            ) : (
              /* Table View - All Submissions */
              <Card className="border-4 border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-4 border-border">
                      <TableHead className="font-black uppercase">Student</TableHead>
                      <TableHead className="font-black uppercase">Status</TableHead>
                      <TableHead className="font-black uppercase text-right">Score</TableHead>
                      <TableHead className="font-black uppercase text-right">Tests</TableHead>
                      <TableHead className="font-black uppercase">Language</TableHead>
                      <TableHead className="font-black uppercase">Submitted</TableHead>
                      <TableHead className="font-black uppercase text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedSubmissions.length > 0 ? (
                      filteredAndSortedSubmissions.map((submission: any) => {
                        const student = submission.user
                        return (
                          <TableRow key={submission.id} className="border-b-2 border-border">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                  {student?.full_name
                                    ?.split(" ")
                                    .map((n: string) => n[0])
                                    .join("") || "?"}
                                </div>
                                <div>
                                  <p className="font-bold text-foreground">{student?.full_name || 'Unknown'}</p>
                                  <p className="text-xs text-muted-foreground">{student?.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(submission.status)}
                                <span className="text-sm font-bold">{getStatusText(submission.status)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={`font-black text-lg ${submission.score >= 80 ? 'text-green-600' : submission.score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {submission.score || 0}
                              </span>
                              <span className="text-muted-foreground">/100</span>
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              {submission.passedTests || submission.passed_tests || 0}/{submission.totalTests || submission.total_tests || 0}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-bold uppercase">
                                {submission.language || 'CPP'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatVietnameseDate(submission.submittedAt || submission.submitted_at)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                className="font-bold uppercase"
                                onClick={() => window.open(`/submissions/${submission.id}/code`, '_blank')}
                              >
                                View Code
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <TableIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                          <p className="font-bold text-lg text-foreground uppercase">No Submissions Found</p>
                          <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <Card className="border-border bg-card p-6">
              <h2 className="mb-4 text-xl font-semibold text-foreground">Problem Configuration</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Time Limit</p>
                    <p className="mt-1 text-sm text-muted-foreground">{problem.time_limit_ms || problem.time_limit || 1000}ms</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Memory Limit</p>
                    <p className="mt-1 text-sm text-muted-foreground">{Math.round((problem.memory_limit_kb || problem.memory_limit || 256000) / 1024)}MB</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Grading Mode</p>
                    <p className="mt-1 text-sm text-muted-foreground uppercase">{problem.grading_mode || 'stdio'}</p>
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
                              {testCase.is_hidden && (
                                <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-500">
                                  Hidden
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">{testCase.points || 10} points</span>
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
                                  {testCase.expected_output || testCase.expectedOutput}
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
                <p className="text-xs text-muted-foreground mt-1">All submissions from all students</p>
              </Card>
              <Card className="border-border bg-card p-6">
                <p className="text-sm font-medium text-muted-foreground">Unique Students</p>
                <p className="mt-2 text-3xl font-bold text-primary">{stats.totalStudents}</p>
                <p className="text-xs text-muted-foreground mt-1">Students who submitted at least once</p>
              </Card>
              <Card className="border-border bg-card p-6">
                <p className="text-sm font-medium text-muted-foreground">Acceptance Rate</p>
                <p className="mt-2 text-3xl font-bold text-green-500">{stats.acceptanceRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">{stats.acceptedCount} students with accepted solution</p>
              </Card>
            </div>

            <Card className="border-border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">Student Performance</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Average Score (Best Submission)</p>
                  <p className="text-4xl font-black text-foreground">{stats.averageScore}</p>
                  <p className="text-xs text-muted-foreground mt-1">Based on each student's best submission</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Score Distribution</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Perfect (100)', min: 100, max: 100, color: 'bg-green-600' },
                      { label: 'Excellent (80-99)', min: 80, max: 99, color: 'bg-green-500' },
                      { label: 'Good (60-79)', min: 60, max: 79, color: 'bg-blue-500' },
                      { label: 'Fair (40-59)', min: 40, max: 59, color: 'bg-yellow-500' },
                      { label: 'Poor (1-39)', min: 1, max: 39, color: 'bg-orange-500' },
                      { label: 'Failed (0)', min: 0, max: 0, color: 'bg-red-500' },
                    ].map((range) => {
                      const count = groupedSubmissions.filter(
                        (s) => (s.score || 0) >= range.min && (s.score || 0) <= range.max
                      ).length
                      const percentage = stats.totalStudents > 0 ? (count / stats.totalStudents) * 100 : 0
                      return (
                        <div key={range.label} className="flex items-center gap-3">
                          <div className="w-32 text-xs text-muted-foreground">{range.label}</div>
                          <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${range.color} transition-all duration-300 flex items-center justify-center text-xs font-bold text-white`}
                              style={{ width: `${percentage}%`, minWidth: count > 0 ? '2rem' : '0' }}
                            >
                              {count > 0 && count}
                            </div>
                          </div>
                          <div className="w-16 text-right text-xs text-muted-foreground">
                            {percentage.toFixed(0)}%
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">Submission Status Breakdown</h3>
              <div className="space-y-3">
                {[
                  { status: 'accepted', label: 'Accepted', color: 'bg-green-500' },
                  { status: 'wrong answer', label: 'Wrong Answer', color: 'bg-red-500' },
                  { status: 'wrong_answer', label: 'Wrong Answer (alt)', color: 'bg-red-500' },
                  { status: 'compile error', label: 'Compile Error', color: 'bg-orange-500' },
                  { status: 'compile_error', label: 'Compile Error (alt)', color: 'bg-orange-500' },
                  { status: 'runtime error', label: 'Runtime Error', color: 'bg-orange-600' },
                  { status: 'runtime_error', label: 'Runtime Error (alt)', color: 'bg-orange-600' },
                  { status: 'time limit exceeded', label: 'Time Limit Exceeded', color: 'bg-yellow-500' },
                  { status: 'time_limit', label: 'Time Limit (alt)', color: 'bg-yellow-500' },
                  { status: 'pending', label: 'Pending', color: 'bg-blue-500' },
                  { status: 'running', label: 'Running', color: 'bg-blue-400' },
                ].reduce((acc, curr) => {
                  // Group similar statuses together
                  const normalizedStatus = curr.status.toLowerCase().replace(/ /g, '_')
                  if (!acc.find((item) => item.normalizedStatus === normalizedStatus)) {
                    acc.push({ ...curr, normalizedStatus })
                  }
                  return acc
                }, [] as any[]).map(({ status, label, color, normalizedStatus }) => {
                  // Count submissions with either format
                  const count = submissions.filter(
                    (s) => s.status?.toLowerCase().replace(/ /g, '_') === normalizedStatus
                  ).length
                  const percentage = submissions.length > 0 ? (count / submissions.length) * 100 : 0
                  
                  if (count === 0) return null // Don't show statuses with 0 submissions
                  
                  return (
                    <div key={normalizedStatus}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-foreground font-medium">{getStatusText(status)}</span>
                        <span className="text-muted-foreground">
                          {count} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full ${color} transition-all duration-300`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {submissions.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No submissions yet</p>
                </div>
              )}
            </Card>

            <Card className="border-border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">Problem Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Difficulty</p>
                  <Badge 
                    variant="outline" 
                    className={`mt-1 font-bold uppercase ${
                      problem.difficulty === 'easy' ? 'border-green-500 text-green-500' :
                      problem.difficulty === 'medium' ? 'border-yellow-500 text-yellow-500' :
                      'border-red-500 text-red-500'
                    }`}
                  >
                    {problem.difficulty}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Grading Mode</p>
                  <p className="mt-1 text-sm font-bold text-foreground uppercase">{problem.grading_mode || 'stdio'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Time Limit</p>
                  <p className="mt-1 text-sm font-bold text-foreground">{problem.time_limit_ms || problem.time_limit || 1000}ms</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Test Cases</p>
                  <p className="mt-1 text-sm font-bold text-foreground">{problem.test_cases?.length || 0} cases</p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
