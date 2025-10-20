"use client"

import { useState, useEffect } from "react"
import { submissionAPI } from "@/services/api"
import type { Submission } from "@/types/submission"

export function useSubmissionHistory(problemId: number) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchSubmissions = async () => {
    try {
      console.log('[REFRESH] Fetching submissions for problem:', problemId)
      const subsResponse = await submissionAPI.getMySubmissions(problemId)
      console.log('[REFRESH] Submissions received:', subsResponse.data)
      
      // Handle both old format (array) and new format (object with data + pagination)
      const submissionsArray = Array.isArray(subsResponse.data) 
        ? subsResponse.data 
        : (subsResponse.data.data || [])
      
      console.log('[REFRESH] Number of submissions:', submissionsArray.length)
      setSubmissions(submissionsArray)
    } catch (err) {
      console.error('Error fetching submissions:', err)
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
