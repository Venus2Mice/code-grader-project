
import { History } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Submission } from "@/types/submission"

interface SubmissionHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  submissions: Submission[]
  onViewSubmission: (submission: Submission) => void
  getStatusDisplay: (status: string | undefined) => any
  formatVietnameseDate: (dateString: string) => string
}

export function SubmissionHistoryModal({
  isOpen,
  onClose,
  submissions,
  onViewSubmission,
  getStatusDisplay,
  formatVietnameseDate
}: SubmissionHistoryModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Submission History</DialogTitle>
          <DialogDescription>
            View your previous submissions and their results
          </DialogDescription>
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
                        {submission.passedTests || submission.passed_tests || 0}/{submission.totalTests || submission.total_tests || 0} tests passed
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatVietnameseDate(submission.submittedAt || submission.submitted_at || '')}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => onViewSubmission(submission)}>
                    Load Code
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
