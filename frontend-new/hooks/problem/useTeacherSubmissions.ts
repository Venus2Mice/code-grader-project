"use client"

import { useState, useEffect } from "react"
import { problemAPI } from "@/services/api"
import type { Submission } from "@/types/submission"

export function useTeacherSubmissions(problemId: number) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const fetchSubmissions = async () => {
    try {
      setIsLoading(true)
      const response = await problemAPI.getSubmissions(problemId, 1, 20)
      
      const submissionsData = Array.isArray(response.data)
        ? response.data
        : (response.data.data || [])
      const pagesCount = response.data.pagination?.pages || 1
      
      setSubmissions(submissionsData)
      setTotalPages(pagesCount)
    } catch (err) {
      console.error('Error fetching submissions:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMoreSubmissions = async () => {
    if (page >= totalPages || isLoadingMore) return
    
    try {
      setIsLoadingMore(true)
      const newPage = page + 1
      const response = await problemAPI.getSubmissions(problemId, newPage, 20)
      
      const newSubmissions = Array.isArray(response.data)
        ? response.data
        : (response.data.data || [])
      
      setSubmissions([...submissions, ...newSubmissions])
      setPage(newPage)
    } catch (err) {
      console.error('Error loading more submissions:', err)
    } finally {
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    if (problemId) {
      fetchSubmissions()
    }
  }, [problemId])

  return {
    submissions,
    isLoading,
    page,
    totalPages,
    isLoadingMore,
    loadMoreSubmissions
  }
}
