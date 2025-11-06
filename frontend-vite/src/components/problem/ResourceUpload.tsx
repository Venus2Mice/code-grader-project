import { useState } from 'react'
import { Upload, Link2, FileUp, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { resourceAPI } from '@/services/api'
import { logger } from '@/lib/logger'

interface ResourceUploadProps {
  problemId: string
  onUploadSuccess?: (resource: any) => void
  onError?: (title: string, message: string) => void
  compact?: boolean // Compact mode for sidebar
}

export function ResourceUpload({ problemId, onUploadSuccess, onError, compact = false }: ResourceUploadProps) {
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

    // Validate file type (allow most common formats)
    const fileName = file.name.toLowerCase()
    const allowedExtensions = [
      // Code
      '.txt', '.cpp', '.py', '.java', '.c', '.h', '.hpp', '.js', '.ts', '.jsx', '.tsx', '.go', '.rs', '.rb', '.php', '.cs', '.swift', '.kt',
      // Documents  
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.odt', '.ods', '.odp', '.rtf', '.md', '.tex',
      // Images
      '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.webp', '.ico', '.tiff', '.tif',
      // Archives
      '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.tgz',
      // Data
      '.json', '.xml', '.csv', '.yaml', '.yml', '.sql',
      // Media
      '.mp3', '.wav', '.mp4', '.avi', '.mov', '.mkv', '.webm'
    ]
    
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext))
    if (!hasValidExtension) {
      onError?.('Invalid file type', 'Please upload a valid file format (code, document, image, archive, etc.)')
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
      // Handle both response.data and response.data.data
      const resourceData = response.data.data || response.data
      onUploadSuccess?.(resourceData)
      setDescription('')
    } catch (err: any) {
      logger.error('File upload failed', err)
      const errorMsg = err.response?.data?.msg || err.response?.data?.message || 'Failed to upload file'
      onError?.('Upload failed', errorMsg)
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
      // Handle both response.data and response.data.data
      const resourceData = response.data.data || response.data
      onUploadSuccess?.(resourceData)
      setDriveLink('')
      setDescription('')
    } catch (err: any) {
      logger.error('Add drive link failed', err)
      const errorMsg = err.response?.data?.msg || err.response?.data?.message || 'Failed to add drive link'
      onError?.('Failed to add drive link', errorMsg)
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
      // Handle both response.data and response.data.data
      const resourceData = response.data.data || response.data
      onUploadSuccess?.(resourceData)
      setExternalLink('')
      setLinkName('')
      setDescription('')
    } catch (err: any) {
      logger.error('Add external link failed', err)
      const errorMsg = err.response?.data?.msg || err.response?.data?.message || 'Failed to add external link'
      onError?.('Failed to add link', errorMsg)
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
    <Card className={`border-4 border-border bg-card shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.3)] ${compact ? 'p-3' : 'p-6'}`}>
      {!compact && <h3 className="mb-6 text-xl font-black uppercase text-foreground">ATTACH RESOURCES</h3>}

      {/* Tab buttons */}
      <div className={`flex gap-2 border-b-4 border-border pb-3 ${compact ? 'mb-3' : 'mb-6'}`}>
        {(['file', 'drive', 'link'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`border-4 border-border font-bold uppercase transition-all ${
              compact ? 'px-2 py-1 text-xs' : 'px-4 py-2'
            } ${
              activeTab === tab
                ? 'bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]'
                : 'bg-muted text-foreground hover:translate-y-1 hover:shadow-none shadow-[3px_3px_0px_0px_rgba(0,0,0,0.5)]'
            }`}
          >
            {tab === 'file' && <Upload className={`inline ${compact ? 'h-3 w-3 mr-1' : 'mr-2 h-4 w-4'}`} />}
            {tab === 'drive' && <FileUp className={`inline ${compact ? 'h-3 w-3 mr-1' : 'mr-2 h-4 w-4'}`} />}
            {tab === 'link' && <Link2 className={`inline ${compact ? 'h-3 w-3 mr-1' : 'mr-2 h-4 w-4'}`} />}
            {compact ? (
              tab === 'file' ? 'File' : tab === 'drive' ? 'Drive' : 'Link'
            ) : (
              tab === 'file' ? 'File Upload' : tab === 'drive' ? 'Google Drive' : 'External Link'
            )}
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
            className={`border-4 border-dashed text-center transition-all ${
              compact ? 'p-4' : 'p-8'
            } ${
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
                <Upload className={compact ? 'h-6 w-6 text-foreground' : 'h-8 w-8 text-foreground'} />
                <p className={`font-bold uppercase text-foreground ${compact ? 'text-xs' : ''}`}>
                  {compact ? 'Click to upload' : 'Drag and drop or click to upload'}
                </p>
                <p className={`text-muted-foreground ${compact ? 'text-xs' : 'text-sm'}`}>Max: 50MB</p>
                {!compact && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Supported: Code, Documents (PDF, Word, Excel), Images, Archives (ZIP, TAR, RAR), and more
                  </p>
                )}
              </div>
            </label>
          </div>

          {!compact && (
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
          )}
        </div>
      )}

      {/* Google Drive Tab */}
      {activeTab === 'drive' && (
        <div className="space-y-4">
          {!compact && (
            <div className="border-l-4 border-yellow-500 bg-yellow-100 p-3">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-700 flex-shrink-0" />
                <p className="text-sm text-yellow-700">
                  <strong>Tip:</strong> Share the folder/file and make sure it's accessible to anyone with the link.
                </p>
              </div>
            </div>
          )}

          <div>
            <label className={`block font-bold uppercase text-foreground mb-2 ${compact ? 'text-xs' : 'text-sm'}`}>
              Google Drive Link
            </label>
            <input
              type="url"
              value={driveLink}
              onChange={(e) => setDriveLink(e.target.value)}
              placeholder="https://drive.google.com/..."
              className={`w-full border-4 border-border bg-background font-mono focus:outline-none focus:ring-2 focus:ring-primary ${compact ? 'p-2 text-xs' : 'p-3 text-sm'}`}
              disabled={isLoading}
            />
          </div>

          {!compact && (
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
          )}

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
            <label className={`block font-bold uppercase text-foreground mb-2 ${compact ? 'text-xs' : 'text-sm'}`}>
              Link Name
            </label>
            <input
              type="text"
              value={linkName}
              onChange={(e) => setLinkName(e.target.value)}
              placeholder="e.g., Lecture Notes"
              className={`w-full border-4 border-border bg-background font-mono focus:outline-none focus:ring-2 focus:ring-primary ${compact ? 'p-2 text-xs' : 'p-3 text-sm'}`}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className={`block font-bold uppercase text-foreground mb-2 ${compact ? 'text-xs' : 'text-sm'}`}>
              URL
            </label>
            <input
              type="url"
              value={externalLink}
              onChange={(e) => setExternalLink(e.target.value)}
              placeholder="https://example.com"
              className={`w-full border-4 border-border bg-background font-mono focus:outline-none focus:ring-2 focus:ring-primary ${compact ? 'p-2 text-xs' : 'p-3 text-sm'}`}
              disabled={isLoading}
            />
          </div>

          {!compact && (
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
          )}

          <Button
            onClick={handleAddExternalLink}
            disabled={isLoading || !externalLink.trim() || !linkName.trim()}
            className={`w-full border-4 border-border bg-purple-500 font-bold uppercase text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 ${compact ? 'px-4 py-2 text-xs' : 'px-6 py-3'}`}
          >
            {isLoading ? 'Adding...' : 'Add Link'}
          </Button>
        </div>
      )}
    </Card>
  )
}
