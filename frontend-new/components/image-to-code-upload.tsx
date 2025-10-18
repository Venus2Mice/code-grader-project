"use client"

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Upload, Image as ImageIcon, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

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
      </Badge>
    )
  }

  return (
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
        {/* File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

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
            </div>

            {/* Processing State */}
            {isProcessing && (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                <span className="text-sm text-muted-foreground">
                  Extracting code from image...
                </span>
              </div>
            )}

            {/* Result Display */}
            {result && !isProcessing && (
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
                  </Alert>
                )}

                {/* Error */}
                {!result.success && result.error && (
                  <Alert className="border-red-500 bg-red-50">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <p className="font-medium">Failed to extract code</p>
                      <p className="text-sm mt-1">{result.error}</p>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Action Buttons */}
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
        </div>
      </CardContent>
    </Card>
  )
}
