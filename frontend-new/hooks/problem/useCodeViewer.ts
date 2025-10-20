"use client"

import { useState } from "react"
import { submissionAPI } from "@/services/api"

interface CodeData {
  code: string
  language: string
}

export function useCodeViewer() {
  const [codeModalOpen, setCodeModalOpen] = useState(false)
  const [codeModalData, setCodeModalData] = useState<CodeData | null>(null)
  const [codeLoading, setCodeLoading] = useState(false)

  const viewCode = async (submissionId: number) => {
    try {
      setCodeLoading(true)
      const response = await submissionAPI.getCode(submissionId)
      setCodeModalData(response.data)
      setCodeModalOpen(true)
    } catch (err) {
      console.error('Error fetching code:', err)
      alert('Failed to fetch code')
    } finally {
      setCodeLoading(false)
    }
  }

  const closeCodeModal = () => {
    setCodeModalOpen(false)
    setCodeModalData(null)
  }

  return {
    codeModalOpen,
    codeModalData,
    codeLoading,
    viewCode,
    closeCodeModal
  }
}
