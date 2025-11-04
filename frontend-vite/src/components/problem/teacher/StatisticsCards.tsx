
import { Card } from "@/components/ui/card"
import type { SubmissionStats } from "@/types"

interface StatisticsCardsProps {
  stats: SubmissionStats
}

export function StatisticsCards({ stats }: StatisticsCardsProps) {
  return (
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
  )
}
