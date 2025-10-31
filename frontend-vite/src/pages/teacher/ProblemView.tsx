
import { useState, useEffect } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import { ArrowLeft, Users, Table as TableIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MarkdownDisplay } from "@/components/problem/MarkdownDisplay"

// Hooks
import { 
  useProblemData,
  useTeacherSubmissions,
  useSubmissionStats,
  useSubmissionFiltering,
  useCodeViewer
} from "@/hooks/problem"

// Components
import {
  StatisticsCards,
  StudentSubmissionCard,
  SubmissionTable,
  CodeViewModal,
  StudentSubmissionsModal,
  StatisticsTab,
  ProblemDetailsTab
} from "@/components/problem/teacher"

export default function TeacherProblemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const problemId = Number(id)

  // Fetch problem data
  const { problem, isLoading: problemLoading } = useProblemData(problemId)

  // Fetch submissions
  const {
    submissions,
    isLoading: submissionsLoading,
    page,
    totalPages,
    isLoadingMore,
    loadMoreSubmissions
  } = useTeacherSubmissions(problemId)

  // Calculate statistics
  const { groupedSubmissions, stats } = useSubmissionStats(submissions)

  // Filtering and sorting
  const {
    viewMode,
    setViewMode,
    filterStatus,
    setFilterStatus,
    sortBy,
    setSortBy,
    filteredAndSortedSubmissions,
    selectedStudentSubmissions,
    handleViewAllSubmissions,
    closeStudentModal
  } = useSubmissionFiltering(groupedSubmissions, submissions)

  // Code viewer
  const {
    codeModalOpen,
    codeModalData,
    codeLoading,
    viewCode,
    closeCodeModal
  } = useCodeViewer()

  const isLoading = problemLoading || submissionsLoading

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
      </div>
    )
  }

  if (!problem) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Problem not found</h2>
          <Link to="/teacher/classes" className="mt-4 inline-block text-primary hover:underline">
            Return to classes
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b-4 border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <Link
            to={`/teacher/class/${problem.class_id}`}
            className="mb-6 inline-flex items-center gap-2 border-4 border-border bg-muted px-4 py-2 font-bold uppercase tracking-wide text-foreground transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
          >
            <ArrowLeft className="h-5 w-5" />
            BACK
          </Link>

          <div className="mt-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-black uppercase text-foreground">{problem.title}</h1>
              <span
                className={`border-4 border-black px-3 py-1 text-sm font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
                  problem.difficulty === "easy"
                    ? "bg-green-400 text-black"
                    : problem.difficulty === "medium"
                      ? "bg-yellow-400 text-black"
                      : "bg-red-400 text-black"
                }`}
              >
                {problem.difficulty}
              </span>
            </div>
            <div className="mt-4">
              {problem.markdown_content ? (
                <MarkdownDisplay markdown={problem.markdown_content} className="border-4" />
              ) : (
                <p className="font-bold text-muted-foreground leading-relaxed">{problem.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Statistics Cards */}
        <StatisticsCards stats={stats} />

        {/* View Mode and Filters */}
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

        {/* Tabs */}
        <Tabs defaultValue="submissions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="submissions">
              Submissions ({viewMode === 'grouped' ? stats.totalStudents : submissions.length})
            </TabsTrigger>
            <TabsTrigger value="details">Problem Details</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>

          {/* Submissions Tab */}
          <TabsContent value="submissions" className="space-y-4">
            {viewMode === 'grouped' ? (
              <div className="grid gap-4">
                {filteredAndSortedSubmissions.length > 0 ? (
                  filteredAndSortedSubmissions.map((submission: any) => (
                    <StudentSubmissionCard
                      key={submission.id}
                      submission={submission}
                      onViewAll={handleViewAllSubmissions}
                      onViewCode={viewCode}
                      codeLoading={codeLoading}
                    />
                  ))
                ) : (
                  <Card className="border-4 border-border p-12 text-center">
                    <Users className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                    <p className="font-bold text-lg text-foreground uppercase">No Submissions Found</p>
                    <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters</p>
                  </Card>
                )}
              </div>
            ) : (
              <SubmissionTable
                submissions={filteredAndSortedSubmissions}
                onViewCode={viewCode}
                codeLoading={codeLoading}
              />
            )}
          </TabsContent>

          {/* Problem Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <ProblemDetailsTab problem={problem} />
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-4">
            <StatisticsTab
              submissions={submissions}
              groupedSubmissions={groupedSubmissions}
              stats={stats}
              problem={problem}
              page={page}
              totalPages={totalPages}
              isLoadingMore={isLoadingMore}
              loadMoreSubmissions={loadMoreSubmissions}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <StudentSubmissionsModal
        student={selectedStudentSubmissions}
        onClose={closeStudentModal}
        onViewCode={viewCode}
        codeLoading={codeLoading}
      />

      <CodeViewModal
        isOpen={codeModalOpen}
        onClose={closeCodeModal}
        codeData={codeModalData}
        isLoading={codeLoading}
      />
    </div>
  )
}
