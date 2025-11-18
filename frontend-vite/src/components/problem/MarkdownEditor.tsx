import { useState, useRef } from "react"
import { Upload, Eye, EyeOff, FileText, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  onFileUpload?: (filename: string) => void
}

// Simple markdown to HTML preview without external dependencies
function renderMarkdownPreview(markdown: string): string {
  const html = markdown
    // Code blocks
    .replace(/```(.*?)\n([\s\S]*?)```/g, "<pre><code>$2</code></pre>")
    // Headers
    .replace(/^### (.*?)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*?)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*?)$/gm, "<h1>$1</h1>")
    // Bold
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    // Lists
    .replace(/^\* (.*?)$/gm, "<li>$1</li>")
    .replace(/(<li>.*?<\/li>)/s, "<ul>$1</ul>")
    // Line breaks
    .replace(/\n/g, "<br/>")
  return html
}

export function MarkdownEditor({ value, onChange, onFileUpload }: MarkdownEditorProps) {
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type === "text/markdown" || file.name.endsWith(".md")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        onChange(content)
        setUploadedFileName(file.name)
        onFileUpload?.(file.name)
      }
      reader.readAsText(file)
    } else {
      alert("Please upload a markdown (.md) file")
    }
  }

  const handleClearMarkdown = () => {
    onChange("")
    setUploadedFileName(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <h3 className="font-bold uppercase text-sm text-foreground">Markdown Content</h3>
          {uploadedFileName && (
            <span className="text-xs bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 px-2 py-1 rounded">
              📄 {uploadedFileName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload .md
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className="gap-2"
          >
            {isPreviewMode ? (
              <>
                <Eye className="h-4 w-4" />
                Edit
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4" />
                Preview
              </>
            )}
          </Button>
          {value && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearMarkdown}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown"
        onChange={handleFileUpload}
        className="hidden"
      />

      {isPreviewMode ? (
        <Card className="border-2 border-border p-6 min-h-[400px] max-h-[600px] overflow-y-auto bg-card">
          <div className="prose dark:prose-invert max-w-none text-sm prose-sm">
            {value ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: renderMarkdownPreview(value)
                }}
                className="space-y-2"
              />
            ) : (
              <p className="text-muted-foreground">No markdown content yet</p>
            )}
          </div>
        </Card>
      ) : (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste markdown content or upload a .md file...
# Example Heading
## Subheading

- Bullet point
- Another point

**Bold text** and *italic text*

\`\`\`python
# Code example
def hello():
    print('Hello, World!')
\`\`\`"
          className="min-h-[400px] max-h-[600px] font-mono text-sm border-2 border-border"
        />
      )}

      <div className="bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-400 dark:border-blue-500 p-3 rounded">
        <p className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase mb-1">
          💡 Tip:
        </p>
        <p className="text-xs text-blue-800 dark:text-blue-300">
          You can use <strong>Markdown</strong> with headers, lists, code blocks, and more.
          Supports GitHub-flavored markdown formatting.
        </p>
      </div>
    </div>
  )
}
