
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { StudentSubmission } from "@/types"
import { getStatusIcon, getStatusText } from "@/lib/teacherUtils"
import { formatVietnameseDate } from "@/lib/problemUtils"

interface StudentSubmissionCardProps {
  submission: StudentSubmission
  onViewAll: (submission: StudentSubmission) => void
  onViewCode: (submissionId: number) => Promise<void>
  codeLoading: boolean
}

export function StudentSubmissionCard({
  submission,
  onViewAll,
  onViewCode,
  codeLoading
}: StudentSubmissionCardProps) {
  const student = submission.user
  const allSubmissionsCount = submission.allSubmissions?.length || 1

  return (
    <Card className="border-4 border-border bg-card p-6">
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
                <span className="text-muted-foreground">Score: </span>
                <span className={`font-black ${((submission.manual_score ?? submission.cached_score ?? submission.score ?? 0)) >= 80 ? 'text-green-600' : ((submission.manual_score ?? submission.cached_score ?? submission.score ?? 0)) >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {submission.manual_score ?? submission.cached_score ?? submission.score ?? 0}/100
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
                Latest: {formatVietnameseDate(submission.submittedAt || submission.submitted_at || '')}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="font-bold uppercase"
            onClick={() => onViewAll(submission)}
          >
            View All ({allSubmissionsCount})
          </Button>
          <Button 
            variant="default" 
            size="sm"
            className="font-bold uppercase"
            onClick={() => onViewCode(submission.id)}
            disabled={codeLoading}
          >
            {codeLoading ? 'Loading...' : 'View Best Code'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
