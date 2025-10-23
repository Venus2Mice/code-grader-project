
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Copy, Download } from "lucide-react"

interface CodeData {
  code: string
  language: string
}

interface CodeViewModalProps {
  isOpen: boolean
  onClose: () => void
  codeData: CodeData | null
  isLoading: boolean
}

const getFileExtension = (language: string): string => {
  const extensions: Record<string, string> = {
    'cpp': 'cpp',
    'c++': 'cpp',
    'python': 'py',
    'python3': 'py',
    'java': 'java',
    'javascript': 'js',
    'nodejs': 'js',
    'csharp': 'cs',
    'go': 'go',
    'rust': 'rs',
    'ruby': 'rb',
    'php': 'php'
  }
  return extensions[language?.toLowerCase() || ''] || 'txt'
}

export function CodeViewModal({ isOpen, onClose, codeData, isLoading }: CodeViewModalProps) {
  const code = codeData?.code || null
  const language = codeData?.language || null
  
  const handleCopy = () => {
    if (code) {
      navigator.clipboard.writeText(code)
      alert('Code copied to clipboard!')
    }
  }

  const handleDownload = () => {
    if (code && language) {
      const element = document.createElement('a')
      const fileName = `submission.${getFileExtension(language)}`
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(code))
      element.setAttribute('download', fileName)
      element.style.display = 'none'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="text-xl font-semibold text-foreground">
            Source Code
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            {language?.toUpperCase() || 'CODE'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center flex-1">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-muted border-t-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground">Loading code...</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-muted rounded-lg border border-border">
              <pre className="flex-1 overflow-auto p-4 text-sm font-mono text-foreground whitespace-pre-wrap break-words leading-relaxed">
                <code>{code || 'No code available'}</code>
              </pre>
            </div>
          )}
        </div>

        <div className="border-t border-border pt-4 flex gap-2">
          <Button
            onClick={handleCopy}
            disabled={isLoading || !code}
            size="sm"
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy
          </Button>
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={isLoading || !code}
            size="sm"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
          <div className="flex-1"></div>
          <Button
            variant="outline"
            onClick={onClose}
            size="sm"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
