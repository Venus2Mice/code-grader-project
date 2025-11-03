
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table as TableIcon } from "lucide-react"
import type { Submission } from "@/types/submission"
import { getStatusIcon, getStatusText } from "@/lib/teacherUtils"
import { formatVietnameseDate } from "@/lib/problemUtils"

interface SubmissionTableProps {
  submissions: Submission[]
  onViewCode: (submissionId: number) => Promise<void>
  codeLoading: boolean
}

export function SubmissionTable({
  submissions,
  onViewCode,
  codeLoading
}: SubmissionTableProps) {
  if (submissions.length === 0) {
    return (
      <Card className="border-4 border-border p-12 text-center">
        <TableIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <p className="font-bold text-lg text-foreground uppercase">No Submissions Found</p>
        <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters</p>
      </Card>
    )
  }

  return (
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
          {submissions.map((submission: Submission) => {
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
                  <span className={`font-black text-lg ${((submission.manual_score ?? submission.cached_score ?? submission.score ?? 0)) >= 80 ? 'text-green-600' : ((submission.manual_score ?? submission.cached_score ?? submission.score ?? 0)) >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {submission.manual_score ?? submission.cached_score ?? submission.score ?? 0}
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
                  {formatVietnameseDate(submission.submittedAt || submission.submitted_at || '')}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-bold uppercase"
                    onClick={() => onViewCode(submission.id)}
                    disabled={codeLoading}
                  >
                    {codeLoading ? 'Loading...' : 'View Code'}
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Card>
  )
}
