
import { useState, useMemo } from "react"
import type { Submission, StudentSubmission } from "@/types/submission"

type ViewMode = 'grouped' | 'table'
type SortBy = 'latest' | 'score' | 'name'

export function useSubmissionFiltering(
  groupedSubmissions: StudentSubmission[],
  submissions: Submission[]
) {
  const [viewMode, setViewMode] = useState<ViewMode>('grouped')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortBy>('latest')
  const [selectedStudentSubmissions, setSelectedStudentSubmissions] = useState<StudentSubmission | null>(null)

  // Filter and sort submissions
  const filteredAndSortedSubmissions = useMemo(() => {
    let filtered = viewMode === 'grouped' ? groupedSubmissions : submissions
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(s => s.status?.toLowerCase() === filterStatus.toLowerCase())
    }
    
    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return (b.score || 0) - (a.score || 0)
        case 'name':
          return (a.user?.full_name || '').localeCompare(b.user?.full_name || '')
        case 'latest':
        default:
          return new Date(b.submittedAt || b.submitted_at || '').getTime() - 
                 new Date(a.submittedAt || a.submitted_at || '').getTime()
      }
    })
    
    return filtered
  }, [viewMode, groupedSubmissions, submissions, filterStatus, sortBy])

  const handleViewAllSubmissions = (submission: StudentSubmission) => {
    setSelectedStudentSubmissions(submission)
  }

  const closeStudentModal = () => {
    setSelectedStudentSubmissions(null)
  }

  return {
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
  }
}
