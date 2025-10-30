
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Problem } from "@/types/problem"
import type { Submission, StudentSubmission, SubmissionStats } from "@/types/submission"

interface StatisticsTabProps {
  submissions: Submission[]
  groupedSubmissions: StudentSubmission[]
  stats: SubmissionStats
  problem: Problem
  page: number
  totalPages: number
  isLoadingMore: boolean
  loadMoreSubmissions: () => Promise<void>
}

export function StatisticsTab({
  submissions,
  groupedSubmissions,
  stats,
  problem,
  page,
  totalPages,
  isLoadingMore,
  loadMoreSubmissions
}: StatisticsTabProps) {
  return (
    <div className="space-y-4">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-4 border-border bg-card p-6">
          <p className="text-sm font-medium text-muted-foreground">Total Submissions</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{submissions.length}</p>
          <p className="text-xs text-muted-foreground mt-1">All submissions from all students</p>
        </Card>
        <Card className="border-4 border-border bg-card p-6">
          <p className="text-sm font-medium text-muted-foreground">Unique Students</p>
          <p className="mt-2 text-3xl font-bold text-primary">{stats.totalStudents}</p>
          <p className="text-xs text-muted-foreground mt-1">Students who submitted at least once</p>
        </Card>
        <Card className="border-4 border-border bg-card p-6">
          <p className="text-sm font-medium text-muted-foreground">Acceptance Rate</p>
          <p className="mt-2 text-3xl font-bold text-green-500">{stats.acceptanceRate}%</p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.acceptedCount} students with accepted solution
          </p>
        </Card>
      </div>

      {/* Student Performance */}
      <Card className="border-4 border-border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Student Performance</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Average Score (Best Submission)
            </p>
            <p className="text-4xl font-black text-foreground">{stats.averageScore}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Based on each student's best submission
            </p>
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
                  (s) => ((s.score ?? s.cached_score) || 0) >= range.min && ((s.score ?? s.cached_score) || 0) <= range.max
                ).length
                const totalStudents = stats.totalStudents ?? stats.total_students ?? 0
                const percentage = totalStudents > 0 ? (count / totalStudents) * 100 : 0
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

      {/* Submission Status Breakdown */}
      <Card className="border-4 border-border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Submission Status Breakdown</h3>
        <div className="space-y-3">
          {[
            { status: 'accepted', label: 'Accepted', color: 'bg-green-500' },
            { status: 'wrong answer', label: 'Wrong Answer', color: 'bg-red-500' },
            { status: 'compile error', label: 'Compile Error', color: 'bg-orange-500' },
            { status: 'runtime error', label: 'Runtime Error', color: 'bg-orange-600' },
            { status: 'time limit exceeded', label: 'Time Limit Exceeded', color: 'bg-yellow-500' },
            { status: 'pending', label: 'Pending', color: 'bg-blue-500' },
            { status: 'running', label: 'Running', color: 'bg-blue-400' },
          ].map(({ status, label, color }) => {
            const normalizedStatus = status.toLowerCase().replace(/ /g, '_')
            const count = submissions.filter(
              (s) => s.status?.toLowerCase().replace(/ /g, '_') === normalizedStatus
            ).length
            const percentage = submissions.length > 0 ? (count / submissions.length) * 100 : 0
            
            if (count === 0) return null
            
            return (
              <div key={normalizedStatus}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-foreground font-medium">{label}</span>
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
        
        {page < totalPages && (
          <div className="mt-6 flex justify-center">
            <Button
              onClick={loadMoreSubmissions}
              disabled={isLoadingMore}
              variant="outline"
              className="font-bold uppercase"
            >
              {isLoadingMore ? 'Loading...' : `Load More (${page}/${totalPages})`}
            </Button>
          </div>
        )}
      </Card>

      {/* Problem Information */}
      <Card className="border-4 border-border bg-card p-6">
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
            <p className="mt-1 text-sm font-bold text-foreground uppercase">
              {problem.grading_mode || 'stdio'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Time Limit</p>
            <p className="mt-1 text-sm font-bold text-foreground">
              {problem.time_limit_ms || problem.time_limit || 1000}ms
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Test Cases</p>
            <p className="mt-1 text-sm font-bold text-foreground">
              {problem.test_cases?.length || 0} cases
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
