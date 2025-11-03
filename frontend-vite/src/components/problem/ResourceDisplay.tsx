import { useState } from 'react'
import { FileText, FileArchive, Image, Music, Film, Download, Trash2, FileJson, File as FileIcon, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { resourceAPI } from '@/services/api'
import { logger } from '@/lib/logger'
import type { Resource } from '@/types'

interface ResourceDisplayProps {
  resources: Resource[]
  onResourceDeleted?: (resourceId: number) => void
  onError?: (title: string, message: string) => void
  canDelete?: boolean
}

function getFileIcon(fileType?: string, resourceType?: string) {
  if (resourceType === 'drive_link') return <FolderOpen className="h-5 w-5" />
  if (resourceType === 'external_link') return <FileIcon className="h-5 w-5" />

  if (!fileType) return <FileIcon className="h-5 w-5" />

  const type = fileType.toLowerCase()

  if (type.includes('pdf')) return <FileText className="h-5 w-5" />
  if (type.includes('image')) return <Image className="h-5 w-5" />
  if (type.includes('audio')) return <Music className="h-5 w-5" />
  if (type.includes('video')) return <Film className="h-5 w-5" />
  if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return <FileArchive className="h-5 w-5" />
  if (type.includes('json')) return <FileJson className="h-5 w-5" />

  return <FileIcon className="h-5 w-5" />
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Unknown size'
  
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`
}

export function ResourceDisplay({
  resources,
  onResourceDeleted,
  onError,
  canDelete = false,
}: ResourceDisplayProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null)

  if (!resources || resources.length === 0) {
    return (
      <Card className="border-4 border-border bg-card p-6 text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.3)]">
        <FileIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <p className="font-bold text-muted-foreground uppercase">No resources attached yet</p>
      </Card>
    )
  }

  const handleDelete = async (resourceId: number) => {
    if (!confirm('Are you sure you want to delete this resource?')) return

    try {
      setDeletingId(resourceId)
      await resourceAPI.delete(resourceId)
      logger.info('Resource deleted successfully', { resourceId })
      onResourceDeleted?.(resourceId)
    } catch (err: any) {
      logger.error('Delete resource failed', err)
      onError?.('Delete failed', err.response?.data?.message || 'Failed to delete resource')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDownload = (resource: Resource) => {
    if (!resource.file_url) return

    try {
      const link = document.createElement('a')
      link.href = resource.file_url
      link.download = resource.file_name || 'download'
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      logger.info('Download initiated', { fileName: resource.file_name })
    } catch (err) {
      logger.error('Download failed', err)
      onError?.('Download failed', 'Failed to download file')
    }
  }

  return (
    <Card className="border-4 border-border bg-card p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.3)]">
      <h3 className="mb-6 text-xl font-black uppercase text-foreground">ATTACHED RESOURCES ({resources.length})</h3>

      <div className="space-y-3">
        {resources.map((resource) => (
          <div
            key={resource.id}
            className="flex items-center justify-between gap-4 border-l-4 border-primary bg-muted/50 p-4"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center border-2 border-border bg-background text-foreground flex-shrink-0">
                {getFileIcon(resource.file_type, resource.resource_type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={resource.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-primary hover:underline truncate"
                  >
                    {resource.file_name}
                  </a>
                  <span className="text-xs font-bold uppercase border border-border bg-background px-2 py-1 text-muted-foreground">
                    {resource.resource_type === 'drive_link'
                      ? 'Google Drive'
                      : resource.resource_type === 'external_link'
                        ? 'Link'
                        : 'File'}
                  </span>
                </div>

                {resource.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{resource.description}</p>
                )}

                {resource.file_size && (
                  <p className="text-xs text-muted-foreground font-mono">
                    {formatFileSize(resource.file_size)}
                  </p>
                )}

                {resource.uploaded_at && (
                  <p className="text-xs text-muted-foreground">
                    Uploaded: {new Date(resource.uploaded_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {resource.resource_type === 'file' && (
                <Button
                  onClick={() => handleDownload(resource)}
                  disabled={deletingId === resource.id}
                  className="border-4 border-border bg-green-500 p-2 text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
                  title="Download"
                >
                  <Download className="h-5 w-5" />
                </Button>
              )}

              {resource.resource_type !== 'file' && (
                <Button
                  onClick={() => {
                    const win = window.open(resource.file_url, '_blank')
                    if (win) win.focus()
                  }}
                  className="border-4 border-border bg-blue-500 px-3 py-2 font-bold text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                >
                  OPEN
                </Button>
              )}

              {canDelete && (
                <Button
                  onClick={() => handleDelete(resource.id)}
                  disabled={deletingId === resource.id}
                  className="border-4 border-border bg-red-500 p-2 text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
                  title="Delete"
                >
                  {deletingId === resource.id ? '...' : <Trash2 className="h-5 w-5" />}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
