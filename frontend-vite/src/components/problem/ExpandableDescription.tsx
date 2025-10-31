import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { MarkdownDisplay } from "./MarkdownDisplay"

interface ExpandableDescriptionProps {
  description: string
  markdownContent?: string | null
  maxLines?: number
  className?: string
}

export function ExpandableDescription({
  description,
  markdownContent,
  maxLines = 2,
  className = ""
}: ExpandableDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Check if we have markdown content
  const hasMarkdown = markdownContent && markdownContent.trim().length > 0
  const displayContent = hasMarkdown ? markdownContent : description

  // Check if content is long enough to need expansion
  const lines = displayContent.split('\n').length
  const needsExpansion = lines > maxLines || displayContent.length > 200

  if (!displayContent || displayContent.trim().length === 0) {
    return (
      <div className="border-4 border-dashed border-muted-foreground/30 bg-muted/30 p-3 mt-3">
        <p className="text-xs font-black uppercase text-muted-foreground italic text-center">
          ⚠️ NO DESCRIPTION PROVIDED
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-2 mt-3 ${className}`}>
      {/* Content wrapper with brutal border */}
      <div className="border-4 border-border bg-muted/30 p-4 relative">
        <div
          className={`overflow-hidden transition-all duration-300 ${
            !isExpanded && needsExpansion
              ? "max-h-[4.5rem]"  // Approximately 2-3 lines
              : "max-h-[2000px]"
          }`}
        >
          {hasMarkdown ? (
            <MarkdownDisplay 
              markdown={markdownContent} 
              className="border-0 p-0 bg-transparent text-sm font-bold leading-relaxed"
            />
          ) : (
            <p className="text-sm font-bold text-foreground leading-relaxed">
              {description}
            </p>
          )}
        </div>
        
        {/* Gradient fade effect when collapsed */}
        {!isExpanded && needsExpansion && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-muted/80 via-muted/40 to-transparent pointer-events-none" />
        )}
      </div>

      {/* Brutal expand/collapse button */}
      {needsExpansion && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-2 border-4 border-border bg-background px-4 py-2 text-xs font-black uppercase text-foreground transition-all hover:translate-x-[2px] hover:translate-y-[2px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              SHOW LESS
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              SHOW MORE
            </>
          )}
        </button>
      )}
    </div>
  )
}
