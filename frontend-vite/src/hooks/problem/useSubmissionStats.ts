
import { useMemo } from "react"
import type { Submission, SubmissionStats, StudentSubmission } from "@/types/submission"

export function useSubmissionStats(submissions: Submission[]) {
  // Group submissions by student (show best submission for each student)
  const groupedSubmissions = useMemo(() => {
    const studentMap = new Map<number, StudentSubmission>()
    
    submissions.forEach(submission => {
      const studentId = submission.user?.id
      if (!studentId) return
      
      const existing = studentMap.get(studentId)
      // Priority: manual_score > cached_score > score
      const submissionScore = submission.manual_score ?? submission.cached_score ?? submission.score ?? 0
      const existingScore = existing ? (existing.manual_score ?? existing.cached_score ?? existing.score ?? 0) : 0
      
      if (!existing || submissionScore > existingScore || 
          (submissionScore === existingScore && 
           new Date(submission.submittedAt || submission.submitted_at || '') > 
           new Date(existing.submittedAt || existing.submitted_at || ''))) {
        studentMap.set(studentId, {
          ...submission,
          allSubmissions: submissions.filter(s => s.user?.id === studentId)
        })
      }
    })
    
    return Array.from(studentMap.values())
  }, [submissions])

  // Calculate statistics
  const stats: SubmissionStats = useMemo(() => {
    const total = groupedSubmissions.length
    const accepted = groupedSubmissions.filter(s => s.status?.toLowerCase() === 'accepted').length
    // Priority: manual_score > cached_score > score
    const avgScore = groupedSubmissions.reduce((sum, s) => sum + (s.manual_score ?? s.cached_score ?? s.score ?? 0), 0) / (total || 1)
    
    return {
      total_students: total,
      accepted_count: accepted,
      acceptance_rate: total > 0 ? ((accepted / total) * 100).toFixed(1) : '0',
      average_score: avgScore.toFixed(1),
      // Convenience aliases
      totalStudents: total,
      acceptedCount: accepted,
      acceptanceRate: total > 0 ? ((accepted / total) * 100).toFixed(1) : '0',
      averageScore: avgScore.toFixed(1)
    }
  }, [groupedSubmissions])

  return {
    groupedSubmissions,
    stats
  }
}
