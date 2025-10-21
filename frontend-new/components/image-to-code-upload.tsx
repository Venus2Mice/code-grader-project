"use client"

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
<<<<<<< HEAD
import { Loader2, Upload, Image as ImageIcon, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
=======
import { Loader2, Upload, Image as ImageIcon, CheckCircle2, AlertTriangle, XCircle, X, Sparkles } from 'lucide-react'
>>>>>>> git-codespace
import { extractCodeFromImage, type OCRResult } from '@/lib/gemini-ocr'

interface ImageToCodeUploadProps {
  language?: string;
  onCodeExtracted: (code: string) => void;
  className?: string;
}

export function ImageToCodeUpload({ 
  language = 'python', 
  onCodeExtracted,
  className = ''
}: ImageToCodeUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<OCRResult | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
<<<<<<< HEAD
=======
  const [isDragging, setIsDragging] = useState(false)
>>>>>>> git-codespace
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

<<<<<<< HEAD
=======
    processFile(file)
  }

  const processFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setResult({
        success: false,
        code: null,
        error: 'Please select a valid image file',
        warnings: [],
        confidence: 'none'
      })
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setResult({
        success: false,
        code: null,
        error: 'File size exceeds 10MB limit',
        warnings: [],
        confidence: 'none'
      })
      return
    }

>>>>>>> git-codespace
    // Create preview
    const preview = URL.createObjectURL(file)
    setPreviewUrl(preview)
    setResult(null)
    setIsProcessing(true)

    try {
      // Extract code from image
      const ocrResult = await extractCodeFromImage(file, { language })
      setResult(ocrResult)

      // If successful, pass code to parent
      if (ocrResult.success && ocrResult.code) {
        onCodeExtracted(ocrResult.code)
      }
    } catch (error) {
      setResult({
        success: false,
        code: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        warnings: [],
        confidence: 'none'
      })
    } finally {
      setIsProcessing(false)
    }
  }

<<<<<<< HEAD
=======
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

>>>>>>> git-codespace
  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleReset = () => {
    setResult(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getConfidenceBadge = (confidence: string) => {
<<<<<<< HEAD
    const variants = {
      high: 'default',
      medium: 'secondary',
      low: 'destructive',
      none: 'outline'
    } as const

    const colors = {
      high: 'text-green-600',
      medium: 'text-yellow-600',
      low: 'text-red-600',
      none: 'text-gray-400'
    }

    return (
      <Badge variant={variants[confidence as keyof typeof variants] || 'outline'}>
        <span className={colors[confidence as keyof typeof colors]}>
          {confidence.toUpperCase()} Confidence
        </span>
=======
    const colors = {
      high: 'bg-green-400 dark:bg-green-600 text-black dark:text-white border-border',
      medium: 'bg-yellow-400 dark:bg-yellow-600 text-black dark:text-white border-border',
      low: 'bg-red-400 dark:bg-red-600 text-black dark:text-white border-border',
      none: 'bg-gray-300 dark:bg-gray-700 text-black dark:text-white border-border'
    }

    return (
      <Badge 
        variant="outline" 
        className={`${colors[confidence as keyof typeof colors]} font-black border-[3px] uppercase text-xs px-3 py-1`}
      >
        {confidence} CONFIDENCE
>>>>>>> git-codespace
      </Badge>
    )
  }

  return (
<<<<<<< HEAD
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Upload Image to Extract Code
        </CardTitle>
        <CardDescription>
          Upload a screenshot or photo of code. AI will extract and format it for you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
=======
    <Card className={`${className} overflow-visible border-[4px] border-border bg-card`}>
      <CardHeader className="bg-primary border-b-[4px] border-border">
        <CardTitle className="flex items-center gap-3 text-2xl text-primary-foreground">
          <div className="p-3 bg-card text-foreground border-[3px] border-border">
            <ImageIcon className="h-6 w-6" />
          </div>
          <span className="font-black uppercase">Upload Image to Extract Code</span>
        </CardTitle>
        <CardDescription className="text-base font-bold text-primary-foreground/90 mt-2">
          Upload a screenshot or photo of code. AI will extract and format it for you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 p-6 bg-card"
      >
>>>>>>> git-codespace
        {/* File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

<<<<<<< HEAD
        {/* Upload Button or Preview */}
        {!previewUrl ? (
          <Button 
            onClick={handleButtonClick} 
            className="w-full"
            variant="outline"
            size="lg"
          >
            <Upload className="mr-2 h-4 w-4" />
            Choose Image
          </Button>
        ) : (
          <div className="space-y-3">
            {/* Image Preview */}
            <div className="relative rounded-lg border overflow-hidden max-h-64">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-full h-auto object-contain"
              />
=======
        {/* Upload Zone or Preview */}
        {!previewUrl ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleButtonClick}
            className={`
              relative border-[4px] border-border p-12 
              cursor-pointer transition-all
              ${isDragging 
                ? 'bg-accent shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.5)] translate-x-[2px] translate-y-[2px]' 
                : 'bg-muted shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.5)] hover:translate-x-[3px] hover:translate-y-[3px]'
              }
            `}
          >
            <div className="flex flex-col items-center justify-center gap-5 text-center">
              <div className={`
                p-5 border-[4px] border-border
                ${isDragging ? 'bg-primary' : 'bg-card'}
              `}>
                <Upload className={`h-10 w-10 ${isDragging ? 'text-primary-foreground' : 'text-foreground'}`} />
              </div>
              
              <div className="space-y-2">
                <p className="text-xl font-black text-foreground uppercase">
                  {isDragging ? 'Drop It Here!' : 'Drag & Drop Image Here'}
                </p>
                <p className="text-base font-bold text-muted-foreground">
                  or click to browse
                </p>
              </div>

              <div className="bg-primary text-primary-foreground px-4 py-2 border-[3px] border-border font-bold text-sm uppercase">
                ✨ AI-Powered Extraction
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Image Preview with Close Button */}
            <div className="relative border-[4px] border-black bg-gray-100 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <Button
                onClick={handleReset}
                variant="destructive"
                size="sm"
                className="absolute top-4 right-4 z-10 h-10 w-10 p-0 bg-red-500 border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-red-600 font-black"
              >
                <X className="h-5 w-5" />
              </Button>
              
              <div className="p-5">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-full h-auto max-h-96 object-contain border-[3px] border-black"
                />
              </div>
>>>>>>> git-codespace
            </div>

            {/* Processing State */}
            {isProcessing && (
<<<<<<< HEAD
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                <span className="text-sm text-muted-foreground">
                  Extracting code from image...
                </span>
=======
              <div className="border-[4px] border-black bg-blue-300 p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex flex-col items-center justify-center gap-5">
                  <div className="relative">
                    <Loader2 className="h-16 w-16 animate-spin text-black" strokeWidth={3} />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="font-black text-xl text-black uppercase">
                      Extracting Code...
                    </p>
                    <p className="text-base font-bold text-black">
                      AI is analyzing your image
                    </p>
                  </div>
                  
                  {/* Animated Progress Bar */}
                  <div className="w-full max-w-sm h-4 bg-white border-[3px] border-black">
                    <div className="h-full bg-black animate-pulse" style={{ width: '70%' }}></div>
                  </div>
                </div>
>>>>>>> git-codespace
              </div>
            )}

            {/* Result Display */}
            {result && !isProcessing && (
<<<<<<< HEAD
              <div className="space-y-3">
                {/* Success */}
                {result.success && result.code && (
                  <Alert className="border-green-500 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="flex items-center justify-between">
                      <span className="text-green-800">
                        Code extracted successfully! {result.code.split('\n').length} lines detected.
                      </span>
                      {getConfidenceBadge(result.confidence)}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Warnings */}
                {result.warnings && result.warnings.length > 0 && (
                  <Alert className="border-yellow-500 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription>
                      <div className="text-yellow-800 space-y-1">
                        <p className="font-medium">Warnings detected:</p>
                        <ul className="text-sm list-disc list-inside space-y-1">
                          {result.warnings.map((warning, idx) => (
                            <li key={idx}>{warning}</li>
                          ))}
                        </ul>
                        <p className="text-xs mt-2 italic">
                          Please review and edit the code before submitting.
                        </p>
                      </div>
                    </AlertDescription>
=======
              <div className="space-y-4">
                {/* Success */}
                {result.success && result.code && (
                  <Alert className="border-[4px] border-black bg-green-300 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-5">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-black text-white border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex-shrink-0">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <AlertDescription className="space-y-3">
                          <div className="flex items-start justify-between flex-wrap gap-3">
                            <div>
                              <p className="text-black font-black text-lg uppercase">
                                Success! 🎉
                              </p>
                              <p className="text-black font-bold text-base mt-1">
                                {result.code.split('\n').length} lines detected
                              </p>
                            </div>
                            {getConfidenceBadge(result.confidence)}
                          </div>
                        </AlertDescription>
                      </div>
                    </div>
>>>>>>> git-codespace
                  </Alert>
                )}

                {/* Error */}
                {!result.success && result.error && (
<<<<<<< HEAD
                  <Alert className="border-red-500 bg-red-50">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <p className="font-medium">Failed to extract code</p>
                      <p className="text-sm mt-1">{result.error}</p>
                    </AlertDescription>
=======
                  <Alert className="border-[4px] border-black bg-red-300 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-5">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-black text-white border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex-shrink-0">
                        <XCircle className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <AlertDescription className="text-black space-y-3">
                          <p className="font-black text-lg uppercase">Failed!</p>
                          <div className="bg-white border-[3px] border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                            <p className="font-bold text-sm">{result.error}</p>
                          </div>
                        </AlertDescription>
                      </div>
                    </div>
>>>>>>> git-codespace
                  </Alert>
                )}
              </div>
            )}

            {/* Action Buttons */}
<<<<<<< HEAD
            <div className="flex gap-2">
              <Button 
                onClick={handleReset} 
                variant="outline" 
                className="flex-1"
              >
                Upload Different Image
              </Button>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1 border-t pt-3">
          <p>• Supported formats: JPEG, PNG, GIF, WebP</p>
          <p>• Maximum file size: 10MB</p>
          <p>• For best results: use clear, well-lit images with readable text</p>
          <p className="text-yellow-600">⚠ Always review extracted code before submitting</p>
=======
            {!isProcessing && (
              <div className="flex gap-4 pt-2">
                <Button 
                  onClick={handleReset} 
                  variant="outline" 
                  className="flex-1 h-12 font-black uppercase text-base bg-white border-[4px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Different Image
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="border-[4px] border-black bg-pink-200 p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-black text-white border-[3px] border-black">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="text-base font-black text-black uppercase">Tips for Best Results:</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div className="bg-white border-[3px] border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-2">
                <span className="text-green-500 font-black text-lg">✓</span>
                <span className="font-bold text-sm text-black">Clear, well-lit images</span>
              </div>
            </div>
            <div className="bg-white border-[3px] border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-2">
                <span className="text-green-500 font-black text-lg">✓</span>
                <span className="font-bold text-sm text-black">Readable text & syntax</span>
              </div>
            </div>
            <div className="bg-white border-[3px] border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-2">
                <span className="text-green-500 font-black text-lg">✓</span>
                <span className="font-bold text-sm text-black">JPEG, PNG, GIF, WebP</span>
              </div>
            </div>
            <div className="bg-white border-[3px] border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-2">
                <span className="text-green-500 font-black text-lg">✓</span>
                <span className="font-bold text-sm text-black">Max 10MB file size</span>
              </div>
            </div>
          </div>
          <div className="bg-black text-white p-4 border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-bold uppercase">
                Always review extracted code before submitting!
              </p>
            </div>
          </div>
>>>>>>> git-codespace
        </div>
      </CardContent>
    </Card>
  )
}
