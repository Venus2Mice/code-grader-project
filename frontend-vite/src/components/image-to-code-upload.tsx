
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Upload, Image as ImageIcon, CheckCircle2, AlertTriangle, XCircle, X, Sparkles } from 'lucide-react'
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
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

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
      </Badge>
    )
  }

  return (
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
        {/* File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

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
            <div className="relative border-[4px] border-border bg-muted dark:bg-muted/50 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.3)]">
              <Button
                onClick={handleReset}
                variant="destructive"
                size="sm"
                className="absolute top-4 right-4 z-10 h-10 w-10 p-0 bg-destructive dark:bg-destructive/80 border-[3px] border-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] hover:bg-destructive/90 font-black"
              >
                <X className="h-5 w-5" />
              </Button>
              
              <div className="p-5">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-full h-auto max-h-96 object-contain border-[3px] border-border"
                />
              </div>
            </div>

            {/* Processing State */}
            {isProcessing && (
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
              </div>
            )}

            {/* Result Display */}
            {result && !isProcessing && (
              <div className="space-y-4">
                {/* Success */}
                {result.success && result.code && (
                  <Alert className="border-[4px] border-border bg-accent/20 dark:bg-accent/10 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.3)] p-5">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-accent text-accent-foreground border-[3px] border-accent shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] flex-shrink-0">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <AlertDescription className="space-y-3">
                          <div className="flex items-start justify-between flex-wrap gap-3">
                            <div>
                              <p className="text-foreground font-black text-lg uppercase">
                                Success! 🎉
                              </p>
                              <p className="text-foreground font-bold text-base mt-1">
                                {result.code.split('\n').length} lines detected
                              </p>
                            </div>
                            {getConfidenceBadge(result.confidence)}
                          </div>
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                )}

                {/* Error */}
                {!result.success && result.error && (
                  <Alert className="border-[4px] border-border bg-destructive/20 dark:bg-destructive/10 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.3)] p-5">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-destructive text-destructive-foreground border-[3px] border-destructive shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] flex-shrink-0">
                        <XCircle className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <AlertDescription className="text-foreground space-y-3">
                          <p className="font-black text-lg uppercase">Failed!</p>
                          <div className="bg-card border-[3px] border-border p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]">
                            <p className="font-bold text-sm">{result.error}</p>
                          </div>
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {!isProcessing && (
              <div className="flex gap-4 pt-2">
                <Button 
                  onClick={handleReset} 
                  variant="outline" 
                  className="flex-1 h-12 font-black uppercase text-base bg-white dark:bg-card border-[4px] border-black dark:border-border shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.2)] transition-all"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Different Image
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="border-[4px] border-border bg-secondary/20 dark:bg-secondary/10 p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.3)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary text-primary-foreground border-[3px] border-border">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="text-base font-black text-foreground uppercase">Tips for Best Results:</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div className="bg-card border-[3px] border-border p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]">
              <div className="flex items-center gap-2">
                <span className="text-accent font-black text-lg">✓</span>
                <span className="font-bold text-sm text-foreground">Clear, well-lit images</span>
              </div>
            </div>
            <div className="bg-card border-[3px] border-border p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]">
              <div className="flex items-center gap-2">
                <span className="text-accent font-black text-lg">✓</span>
                <span className="font-bold text-sm text-foreground">Readable text & syntax</span>
              </div>
            </div>
            <div className="bg-card border-[3px] border-border p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]">
              <div className="flex items-center gap-2">
                <span className="text-accent font-black text-lg">✓</span>
                <span className="font-bold text-sm text-foreground">JPEG, PNG, GIF, WebP</span>
              </div>
            </div>
            <div className="bg-card border-[3px] border-border p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]">
              <div className="flex items-center gap-2">
                <span className="text-accent font-black text-lg">✓</span>
                <span className="font-bold text-sm text-foreground">Max 10MB file size</span>
              </div>
            </div>
          </div>
          <div className="bg-primary text-primary-foreground p-4 border-[3px] border-border shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.3)]">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-bold uppercase">
                Always review extracted code before submitting!
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
