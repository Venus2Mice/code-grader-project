
import { useState, useRef } from "react"
import type { CodeAnalysis } from "@/types/problem"

interface UseFileUploadProps {
  onCodeLoaded: (code: string, fileName: string) => void
  onError: (title: string, message: string) => void
  analyzeCppCode: (code: string) => CodeAnalysis
}

export function useFileUpload({ 
  onCodeLoaded, 
  onError, 
  analyzeCppCode
}: UseFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = (file: File) => {
    const fileName = file.name.toLowerCase()
    const fileExtension = fileName.split('.').pop()

    // Allow .cpp, .py, .java, and .txt files
    const allowedExtensions = ['cpp', 'py', 'java', 'txt']
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      onError("Invalid File Type", "Only .cpp, .py, .java, and .txt files are allowed for upload.")
      return
    }

    // Read file content
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      
      // Analyze C++ code structure if it's a .cpp file
      if (fileExtension === 'cpp') {
        const analysis = analyzeCppCode(content)
        
        // Show analysis result (function-based grading only)
        const analysisMessage = `File: ${file.name}\n\n${analysis.analysis}\n\n` +
                 `📌 This system uses FUNCTION-BASED grading\n` +
                 (analysis.hasMain 
                   ? '⚠️ Your code has main() - it may not work correctly!\n' +
                     '💡 Tip: Remove main() and only implement the required function'
                   : '✅ Your code structure looks good for function-based grading') +
                 `\n\nCode loaded into editor. You can review and edit before submitting.`
        
        onError("📊 Code Analysis Result", analysisMessage)
      }
      
      onCodeLoaded(content, file.name)
      setUploadedFileName(file.name)
    }
    reader.onerror = () => {
      onError("File Read Error", "Failed to read the file. Please try again.")
    }
    reader.readAsText(file)

    // Reset file input for next upload
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    processFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  return {
    isDragging,
    uploadedFileName,
    fileInputRef,
    handleFileUpload,
    handleDragOver,
    handleDragLeave,
    handleDrop
  }
}
