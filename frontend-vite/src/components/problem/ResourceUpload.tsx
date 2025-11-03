import { useState } from 'react'
import { Upload, Link2, FileUp, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { resourceAPI } from '@/services/api'
import { logger } from '@/lib/logger'

interface ResourceUploadProps {
  problemId: number
  onUploadSuccess?: (resource: any) => void
  onError?: (title: string, message: string) => void
}

export function ResourceUpload({ problemId, onUploadSuccess, onError }: ResourceUploadProps) {
  const [activeTab, setActiveTab] = useState<'file' | 'drive' | 'link'>('file')
  const [isLoading, setIsLoading] = useState(false)
  const [driveLink, setDriveLink] = useState('')
  const [externalLink, setExternalLink] = useState('')
  const [linkName, setLinkName] = useState('')
  const [description, setDescription] = useState('')
  const [dragActive, setDragActive] = useState(false)

  // Handle file upload
  const handleFileUpload = async (files: FileList) => {
    if (!files || files.length === 0) return

    const file = files[0]
    
    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      onError?.('File too large', 'Maximum file size is 50MB')
      return
    }

    try {
      setIsLoading(true)
      const formData = new FormData()
      formData.append('file', file)
      if (description) {
        formData.append('description', description)
      }

      const response = await resourceAPI.upload(problemId, formData)
      logger.info('File uploaded successfully', { fileName: file.name })
      onUploadSuccess?.(response.data.data)
      setDescription('')
    } catch (err: any) {
      logger.error('File upload failed', err)
      onError?.('Upload failed', err.response?.data?.message || 'Failed to upload file')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Google Drive link
  const handleAddDriveLink = async () => {
    if (!driveLink.trim()) {
      onError?.('Invalid input', 'Please enter a Google Drive link')
      return
    }

    try {
      setIsLoading(true)
      const response = await resourceAPI.addDriveLink(problemId, {
        drive_link: driveLink,
        description: description || undefined,
      })
      logger.info('Drive link added successfully')
      onUploadSuccess?.(response.data.data)
      setDriveLink('')
      setDescription('')
    } catch (err: any) {
      logger.error('Add drive link failed', err)
      onError?.('Failed', err.response?.data?.message || 'Failed to add drive link')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle external link
  const handleAddExternalLink = async () => {
    if (!externalLink.trim() || !linkName.trim()) {
      onError?.('Invalid input', 'Please enter both link and name')
      return
    }

    try {
      setIsLoading(true)
      const response = await resourceAPI.addExternalLink(problemId, {
        file_url: externalLink,
        file_name: linkName,
        description: description || undefined,
      })
      logger.info('External link added successfully')
      onUploadSuccess?.(response.data.data)
      setExternalLink('')
      setLinkName('')
      setDescription('')
    } catch (err: any) {
      logger.error('Add external link failed', err)
      onError?.('Failed', err.response?.data?.message || 'Failed to add external link')
    } finally {
      setIsLoading(false)
    }
  }

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  return (
    <Card className="border-4 border-border bg-card p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.3)]">
      <h3 className="mb-6 text-xl font-black uppercase text-foreground">ATTACH RESOURCES</h3>

      {/* Tab buttons */}
      <div className="mb-6 flex gap-2 border-b-4 border-border pb-4">
        {(['file', 'drive', 'link'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`border-4 border-border px-4 py-2 font-bold uppercase transition-all ${
              activeTab === tab
                ? 'bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]'
                : 'bg-muted text-foreground hover:translate-y-1 hover:shadow-none shadow-[3px_3px_0px_0px_rgba(0,0,0,0.5)]'
            }`}
          >
            {tab === 'file' && <Upload className="mr-2 inline h-4 w-4" />}
            {tab === 'drive' && <FileUp className="mr-2 inline h-4 w-4" />}
            {tab === 'link' && <Link2 className="mr-2 inline h-4 w-4" />}
            {tab === 'file' ? 'File Upload' : tab === 'drive' ? 'Google Drive' : 'External Link'}
          </button>
        ))}
      </div>

      {/* File Upload Tab */}
      {activeTab === 'file' && (
        <div className="space-y-4">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-4 border-dashed p-8 text-center transition-all ${
              dragActive
                ? 'border-primary bg-primary/10'
                : 'border-border bg-muted/50'
            }`}
          >
            <input
              type="file"
              id="file-upload"
              onChange={(e) => handleFileUpload(e.target.files!)}
              className="hidden"
              disabled={isLoading}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="flex flex-col items-center justify-center gap-2">
                <Upload className="h-8 w-8 text-foreground" />
                <p className="font-bold uppercase text-foreground">Drag and drop or click to upload</p>
                <p className="text-sm text-muted-foreground">Max file size: 50MB</p>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase text-foreground mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for this file..."
              className="w-full border-4 border-border bg-background p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              disabled={isLoading}
            />
          </div>
        </div>
      )}

      {/* Google Drive Tab */}
      {activeTab === 'drive' && (
        <div className="space-y-4">
          <div className="border-l-4 border-yellow-500 bg-yellow-100 p-3">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-700 flex-shrink-0" />
              <p className="text-sm text-yellow-700">
                <strong>Tip:</strong> Share the folder/file and make sure it's accessible to anyone with the link.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase text-foreground mb-2">
              Google Drive Link
            </label>
            <input
              type="url"
              value={driveLink}
              onChange={(e) => setDriveLink(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
              className="w-full border-4 border-border bg-background p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase text-foreground mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for this link..."
              className="w-full border-4 border-border bg-background p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              disabled={isLoading}
            />
          </div>

          <Button
            onClick={handleAddDriveLink}
            disabled={isLoading || !driveLink.trim()}
            className="w-full border-4 border-border bg-blue-500 px-6 py-3 font-bold uppercase text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
          >
            {isLoading ? 'Adding...' : 'Add Drive Link'}
          </Button>
        </div>
      )}

      {/* External Link Tab */}
      {activeTab === 'link' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold uppercase text-foreground mb-2">
              Link Name
            </label>
            <input
              type="text"
              value={linkName}
              onChange={(e) => setLinkName(e.target.value)}
              placeholder="e.g., Lecture Notes, Reference Material"
              className="w-full border-4 border-border bg-background p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase text-foreground mb-2">
              URL
            </label>
            <input
              type="url"
              value={externalLink}
              onChange={(e) => setExternalLink(e.target.value)}
              placeholder="https://example.com"
              className="w-full border-4 border-border bg-background p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase text-foreground mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for this link..."
              className="w-full border-4 border-border bg-background p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              disabled={isLoading}
            />
          </div>

          <Button
            onClick={handleAddExternalLink}
            disabled={isLoading || !externalLink.trim() || !linkName.trim()}
            className="w-full border-4 border-border bg-purple-500 px-6 py-3 font-bold uppercase text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
          >
            {isLoading ? 'Adding...' : 'Add Link'}
          </Button>
        </div>
      )}
    </Card>
  )
}
