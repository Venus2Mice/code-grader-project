
import { useState, useEffect } from "react"
import { submissionAPI } from "@/services/api"
import type { Submission } from "@/types/submission"
import { logger } from "@/lib/logger"

export function useSubmissionHistory(problemId: number) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchSubmissions = async () => {
    try {
      logger.debug('Fetching submissions for problem', { problemId })
      const subsResponse = await submissionAPI.getMySubmissions(problemId)
      
      // Handle both old format (array) and new format (object with data + pagination)
      const submissionsArray = Array.isArray(subsResponse.data) 
        ? subsResponse.data 
        : (subsResponse.data.data || [])
      
      logger.debug('Submissions fetched', { count: submissionsArray.length })
      setSubmissions(submissionsArray)
    } catch (err) {
      logger.error('Error fetching submissions', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (problemId) {
      fetchSubmissions()
    }
  }, [problemId])

  const refreshSubmissions = () => {
    fetchSubmissions()
  }

  return {
    submissions,
    isLoading,
    refreshSubmissions
  }
}
