"use client"

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
      if (!existing || submission.score > existing.score || 
          (submission.score === existing.score && 
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
    const avgScore = groupedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / (total || 1)
    
    return {
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
