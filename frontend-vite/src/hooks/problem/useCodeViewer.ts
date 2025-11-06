
import { useState } from "react"
import { submissionAPI } from "@/services/api"
import { logger } from "@/lib/logger"

interface CodeData {
  code: string
  language: string
}

export function useCodeViewer() {
  const [codeModalOpen, setCodeModalOpen] = useState(false)
  const [codeModalData, setCodeModalData] = useState<CodeData | null>(null)
  const [codeLoading, setCodeLoading] = useState(false)

  const viewCode = async (submissionId: number) => {
    // Don't open modal until data is ready
    setCodeLoading(true)
    
    try {
      const response = await submissionAPI.getCode(submissionId)
      // Set data first
      setCodeModalData(response.data)
      // Only after successfully fetching, open the modal
      setCodeModalOpen(true)
    } catch (err) {
      logger.error('Error fetching code', err, { submissionId })
      alert('Failed to fetch code')
    } finally {
      setCodeLoading(false)
    }
  }

  const closeCodeModal = () => {
    setCodeModalOpen(false)
    // Clear data when closing to prevent showing old code on next open
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
