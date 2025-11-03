
import { useState, useEffect } from "react"
import { problemAPI } from "@/services/api"
import type { Problem } from "@/types/problem"
import { logger } from "@/lib/logger"

export function useProblemData(problemToken: string) {
  const [problem, setProblem] = useState<Problem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [classToken, setClassToken] = useState<string | null>(null)

  useEffect(() => {
    // Get classToken from URL or localStorage
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const classTokenFromUrl = urlParams.get('classToken')
      
      if (classTokenFromUrl) {
        setClassToken(classTokenFromUrl)
        localStorage.setItem(`problem_${problemToken}_classToken`, classTokenFromUrl)
      } else {
        const savedClassToken = localStorage.getItem(`problem_${problemToken}_classToken`)
        if (savedClassToken) {
          setClassToken(savedClassToken)
        }
      }
    }
  }, [problemToken])

  useEffect(() => {
    const fetchProblemData = async () => {
      try {
        setIsLoading(true)
        const response = await problemAPI.getByToken(problemToken)
        const problemData = response.data
        setProblem(problemData)
        
        if (problemData.class_token) {
          setClassToken(String(problemData.class_token))
          localStorage.setItem(`problem_${problemToken}_classToken`, String(problemData.class_token))
        }
      } catch (err) {
        logger.error('Error fetching problem', err, { problemToken })
      } finally {
        setIsLoading(false)
      }
    }

    if (problemToken) {
      fetchProblemData()
    }
  }, [problemToken])

  return {
    problem,
    isLoading,
    classToken
  }
}
