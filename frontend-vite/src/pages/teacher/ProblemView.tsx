
import { useState, useEffect } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import { ArrowLeft, Users, Table as TableIcon, Edit, Trash2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MarkdownDisplay } from "@/components/problem/MarkdownDisplay"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { problemAPI } from "@/services/api"
import { logger } from "@/lib/logger"

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
  const { token } = useParams<{ token: string }>()
  const problemToken = token as string
  const navigate = useNavigate()

  // Guard against null/undefined token
  useEffect(() => {
    if (!problemToken || problemToken === 'null' || problemToken === 'undefined') {
      logger.error('Invalid problem token in ProblemView', { token: problemToken })
      navigate('/teacher/dashboard')
    }
  }, [problemToken, navigate])

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    isDeleting: false
  })

  // Fetch problem data
  const { problem, isLoading: problemLoading, classToken } = useProblemData(problemToken)

  // Fetch submissions
  const {
    submissions,
    isLoading: submissionsLoading,
    page,
    totalPages,
    isLoadingMore,
    loadMoreSubmissions
  } = useTeacherSubmissions(problemToken)

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

  const handleDeleteProblem = async () => {
    setDeleteModal({ ...deleteModal, isDeleting: true })
    
    try {
      const response = await problemAPI.delete(problemToken)
      const data = response.data
      
      logger.info('Problem deleted', { 
        problemToken, 
        submissionsDeleted: data.submissions_deleted 
      })
      
      // Navigate back to class
      navigate(`/teacher/class/${classToken}`)
    } catch (err: any) {
      logger.error('Error deleting problem', err, { problemToken })
      alert(err.response?.data?.msg || 'Failed to delete problem')
      setDeleteModal({ isOpen: false, isDeleting: false })
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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Problem not found</h2>
          <Link to="/teacher/dashboard" className="mt-4 inline-block text-primary hover:underline">
            Return to dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b-4 border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-100 via-white to-amber-100 dark:from-gray-900 dark:via-gray-800 dark:to-orange-950">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <Link
            to={`/teacher/class/${classToken || ''}`}
            className="mb-6 inline-flex items-center gap-2 border-4 border-border bg-white dark:bg-gray-800 px-4 py-2 font-bold uppercase tracking-wide text-foreground transition-all hover:bg-primary hover:text-white hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <ArrowLeft className="h-5 w-5" />
            BACK
          </Link>

          <div className="mt-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-black uppercase text-gray-900 dark:text-white">{problem.title}</h1>
                <span
                  className={`border-3 px-3 py-1 text-sm font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] ${
                    problem.difficulty === "easy"
                      ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-100 border-emerald-300 dark:border-emerald-700"
                      : problem.difficulty === "medium"
                        ? "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100 border-amber-300 dark:border-amber-700"
                        : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 border-red-300 dark:border-red-700"
                  }`}
                >
                  {problem.difficulty}
                </span>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Link
                  to={`/teacher/problem/${problemToken}/edit`}
                  className="inline-flex items-center gap-2 border-4 border-border bg-yellow-400 px-5 py-2.5 font-black uppercase tracking-wide text-black transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <Edit className="h-5 w-5" />
                  EDIT
                </Link>
                
                <Button
                  onClick={() => setDeleteModal({ isOpen: true, isDeleting: false })}
                  className="inline-flex items-center gap-2 border-4 border-border bg-red-500 px-5 py-2.5 font-black uppercase tracking-wide text-white transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <Trash2 className="h-5 w-5" />
                  DELETE
                </Button>
              </div>
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
              <SelectTrigger className="w-[200px] font-bold border-3 border-gray-700 dark:border-gray-400 bg-white dark:bg-gray-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)]">
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
              <SelectTrigger className="w-[200px] font-bold border-3 border-gray-700 dark:border-gray-400 bg-white dark:bg-gray-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)]">
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

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModal.isOpen} onOpenChange={(open) => setDeleteModal({ ...deleteModal, isOpen: open })}>
        <DialogContent className="sm:max-w-md border-4 border-border">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-red-100 dark:bg-red-950">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <DialogTitle className="text-xl font-black uppercase text-red-600 dark:text-red-400">
                DELETE PROBLEM?
              </DialogTitle>
            </div>
            <DialogDescription className="text-base text-foreground mt-4 space-y-3">
              <p className="font-bold">
                Are you sure you want to delete "<span className="text-primary">{problem.title}</span>"?
              </p>
              
              {submissions.length > 0 ? (
                <div className="border-4 border-orange-500 bg-orange-50 dark:bg-orange-950 p-4 mt-3">
                  <p className="font-black text-orange-900 dark:text-orange-100 uppercase text-sm mb-2">
                    ⚠️ Warning
                  </p>
                  <p className="text-sm font-bold text-orange-700 dark:text-orange-300">
                    This problem has <span className="font-black text-lg">{submissions.length}</span> submission{submissions.length > 1 ? 's' : ''}.
                    All submissions will be permanently deleted.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  This problem has no submissions yet.
                </p>
              )}
              
              <p className="text-sm font-bold text-red-600 dark:text-red-400 mt-3">
                This action cannot be undone!
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-3">
            <Button 
              variant="outline"
              onClick={() => setDeleteModal({ isOpen: false, isDeleting: false })}
              disabled={deleteModal.isDeleting}
              className="border-4 border-border font-black uppercase"
            >
              CANCEL
            </Button>
            <Button 
              onClick={handleDeleteProblem}
              disabled={deleteModal.isDeleting}
              className="border-4 border-border bg-red-500 font-black uppercase text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
            >
              {deleteModal.isDeleting ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  DELETING...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  DELETE PERMANENTLY
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
