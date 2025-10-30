import { Card } from "@/components/ui/card"

interface MarkdownDisplayProps {
  markdown: string | null | undefined
  className?: string
}

// Simple markdown to HTML renderer
function renderMarkdown(markdown: string): string {
  if (!markdown) return ""

  let html = markdown
    // Escape HTML special characters first (except for the markdown formatting we want)
    // Code blocks (preserve content)
    .replace(/```(.*?)\n([\s\S]*?)```/g, (match, lang, code) => {
      const escapedCode = code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
      return `<pre><code class="language-${lang || 'plain'}">${escapedCode}</code></pre>`
    })
    // Headers
    .replace(/^### (.*?)$/gm, "<h3 class='text-lg font-bold mt-4 mb-2'>$1</h3>")
    .replace(/^## (.*?)$/gm, "<h2 class='text-xl font-bold mt-5 mb-2'>$1</h2>")
    .replace(/^# (.*?)$/gm, "<h1 class='text-2xl font-bold mt-6 mb-3'>$1</h1>")
    // Horizontal rule
    .replace(/^---$/gm, "<hr class='my-4' />")
    // Bold
    .replace(/\*\*(.*?)\*\*/g, "<strong class='font-bold'>$1</strong>")
    .replace(/__(.+?)__/g, "<strong class='font-bold'>$1</strong>")
    // Italic
    .replace(/\*(.*?)\*/g, "<em class='italic'>$1</em>")
    .replace(/_(.+?)_/g, "<em class='italic'>$1</em>")
    // Inline code
    .replace(/`([^`]+)`/g, "<code class='bg-muted px-1.5 py-0.5 rounded font-mono text-xs'>$1</code>")
    // Blockquote
    .replace(/^> (.*?)$/gm, "<blockquote class='border-l-4 border-purple-600 pl-4 italic my-3'>$1</blockquote>")
    // Unordered lists
    .replace(/^\* (.*?)$/gm, "<li>$1</li>")
    .replace(/^- (.*?)$/gm, "<li>$1</li>")
    .replace(/(<li>.*?<\/li>)/s, "<ul class='list-disc list-inside mb-3 space-y-1'>$1</ul>")
    // Ordered lists
    .replace(/^\d+\. (.*?)$/gm, "<li>$1</li>")
    .replace(/(<li>.*?<\/li>)/s, "<ol class='list-decimal list-inside mb-3 space-y-1'>$1</ol>")
    // Line breaks - preserve multiple line breaks
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>")

  // Wrap in paragraphs
  html = `<p>${html}</p>`

  return html
}

export function MarkdownDisplay({ markdown, className = "" }: MarkdownDisplayProps) {
  if (!markdown) {
    return (
      <div className={`text-muted-foreground text-sm ${className}`}>
        No description provided
      </div>
    )
  }

  const htmlContent = renderMarkdown(markdown)

  return (
    <Card className={`border-2 border-border p-6 bg-card ${className}`}>
      <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
        <div
          dangerouslySetInnerHTML={{ __html: htmlContent }}
          className="space-y-3 text-foreground"
        />
      </div>
    </Card>
  )
}
