import { useState, useCallback } from 'react'

interface ErrorModal {
  isOpen: boolean
  title: string
  message: string
}

/**
 * Custom hook for managing error modal state
 * Reduces complexity in components by centralizing modal logic
 */
export function useErrorModal() {
  const [errorModal, setErrorModal] = useState<ErrorModal>({
    isOpen: false,
    title: '',
    message: '',
  })

  const openError = useCallback((title: string, message: string) => {
    setErrorModal({
      isOpen: true,
      title,
      message,
    })
  }, [])

  const closeError = useCallback(() => {
    setErrorModal({
      isOpen: false,
      title: '',
      message: '',
    })
  }, [])

  return {
    errorModal,
    openError,
    closeError,
  }
}
