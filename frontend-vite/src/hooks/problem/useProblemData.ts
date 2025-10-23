
import { useState, useEffect } from "react"
import { problemAPI } from "@/services/api"
import type { Problem } from "@/types/problem"
import { logger } from "@/lib/logger"

export function useProblemData(problemId: number) {
  const [problem, setProblem] = useState<Problem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [classId, setClassId] = useState<string | null>(null)

  useEffect(() => {
    // Get classId from URL or localStorage
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const classIdFromUrl = urlParams.get('classId')
      
      if (classIdFromUrl) {
        setClassId(classIdFromUrl)
        localStorage.setItem(`problem_${problemId}_classId`, classIdFromUrl)
      } else {
        const savedClassId = localStorage.getItem(`problem_${problemId}_classId`)
        if (savedClassId) {
          setClassId(savedClassId)
        }
      }
    }
  }, [problemId])

  useEffect(() => {
    const fetchProblemData = async () => {
      try {
        setIsLoading(true)
        const response = await problemAPI.getById(problemId)
        const problemData = response.data
        setProblem(problemData)
        
        if (problemData.class_id) {
          setClassId(String(problemData.class_id))
          localStorage.setItem(`problem_${problemId}_classId`, String(problemData.class_id))
        }
      } catch (err) {
        logger.error('Error fetching problem', err, { problemId })
      } finally {
        setIsLoading(false)
      }
    }

    if (problemId) {
      fetchProblemData()
    }
  }, [problemId])

  return {
    problem,
    isLoading,
    classId
  }
}
