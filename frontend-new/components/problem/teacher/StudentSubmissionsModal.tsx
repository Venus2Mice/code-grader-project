"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { StudentSubmission } from "@/types/submission"

interface StudentSubmissionsModalProps {
  student: StudentSubmission | null
  onClose: () => void
  onViewCode: (submissionId: number) => Promise<void>
  codeLoading: boolean
}

export function StudentSubmissionsModal({
  student,
  onClose,
  onViewCode,
  codeLoading
}: StudentSubmissionsModalProps) {
  if (!student) return null
  
  const studentName = student.user?.full_name || 'Unknown'
  const submissions = student.allSubmissions || []
  
  return (
    <Dialog open={!!student} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="border-b border-border pb-4">
          <DialogTitle className="text-2xl font-semibold text-foreground">
            {studentName}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {submissions.length > 0 ? (
            <div className="space-y-3 py-4">
              {submissions.map((sub: any, idx: number) => (
                <div key={sub.id} className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-1 rounded">
                          #{idx + 1}
                        </span>
                        <Badge 
                          variant="outline"
                          className={`text-xs font-semibold ${
                            sub.status?.toLowerCase() === 'accepted' 
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : sub.status?.toLowerCase().includes('compile') 
                              ? 'bg-red-50 text-red-700 border-red-200' 
                              : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }`}
                        >
                          {sub.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-6 mt-3">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Score</p>
                          <p className={`text-2xl font-bold mt-1 ${
                            sub.score >= 80 ? 'text-green-600' : 
                            sub.score >= 50 ? 'text-yellow-600' : 
                            'text-red-600'
                          }`}>
                            {sub.score || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Tests Passed</p>
                          <p className="text-2xl font-bold mt-1 text-foreground">
                            {sub.passedTests || sub.passed_tests || 0}/{sub.totalTests || sub.total_tests || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Language</p>
                          <p className="text-lg font-semibold mt-1 text-foreground uppercase">
                            {sub.language || 'CPP'}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground mt-3">
                        {new Date(sub.submittedAt || sub.submitted_at || '').toLocaleString('vi-VN')}
                      </p>
                    </div>

                    <Button
                      onClick={() => onViewCode(sub.id)}
                      disabled={codeLoading}
                      className="font-semibold"
                      size="sm"
                    >
                      View Code
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              No submissions found
            </div>
          )}
        </div>

        <div className="border-t border-border pt-4 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
