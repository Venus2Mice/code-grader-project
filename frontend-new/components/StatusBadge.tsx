/**
 * StatusBadge Component
 * Reusable component for displaying submission/test status
 * Sử dụng getStatusDisplay từ problemUtils để đảm bảo consistency
 */

import { LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getStatusDisplay } from "@/lib/problemUtils"
import { cn } from "@/lib/utils"

export interface StatusBadgeProps {
  status: string | undefined
  variant?: "default" | "compact" | "detailed"
  showIcon?: boolean
  className?: string
}

/**
 * StatusBadge - Display status with icon and color
 * 
 * @param status - Status string (e.g., "accepted", "wrong_answer")
 * @param variant - Display variant
 *   - "default": Full size with icon and label
 *   - "compact": Smaller, icon only or short label
 *   - "detailed": Larger with additional info
 * @param showIcon - Show/hide icon (default: true)
 * @param className - Additional CSS classes
 * 
 * @example
 * <StatusBadge status="accepted" />
 * <StatusBadge status="wrong_answer" variant="compact" />
 * <StatusBadge status="compile_error" showIcon={false} />
 */
export function StatusBadge({
  status,
  variant = "default",
  showIcon = true,
  className,
}: StatusBadgeProps) {
  const { icon: Icon, color, bg, label } = getStatusDisplay(status)

  if (variant === "compact") {
    return (
      <Badge
        className={cn(
          "flex items-center gap-1 px-2 py-1 text-xs font-bold",
          bg,
          color,
          "border-2 border-border",
          className
        )}
      >
        {showIcon && <Icon className="h-3 w-3" />}
        {label}
      </Badge>
    )
  }

  if (variant === "detailed") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border-4 border-border p-4",
          bg,
          className
        )}
      >
        {showIcon && <Icon className={cn("h-8 w-8", color)} />}
        <div className="flex flex-col">
          <span className={cn("text-lg font-black", color)}>{label}</span>
          <span className="text-xs text-muted-foreground">Status</span>
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <Badge
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 text-sm font-bold",
        bg,
        color,
        "border-2 border-border",
        className
      )}
    >
      {showIcon && <Icon className="h-4 w-4" />}
      {label}
    </Badge>
  )
}

/**
 * StatusIcon - Just the icon with color
 */
export function StatusIcon({
  status,
  className,
  size = 16,
}: {
  status: string | undefined
  className?: string
  size?: number
}) {
  const { icon: Icon, color } = getStatusDisplay(status)

  return <Icon className={cn(color, className)} size={size} />
}

/**
 * StatusText - Just the text with color
 */
export function StatusText({
  status,
  className,
}: {
  status: string | undefined
  className?: string
}) {
  const { color, label } = getStatusDisplay(status)

  return <span className={cn("font-bold", color, className)}>{label}</span>
}

/**
 * StatusCard - Card-style status display
 * Useful for larger, more prominent status displays
 */
export function StatusCard({
  status,
  title,
  description,
  className,
}: {
  status: string | undefined
  title?: string
  description?: string
  className?: string
}) {
  const { icon: Icon, color, bg } = getStatusDisplay(status)

  return (
    <div
      className={cn(
        "flex items-start gap-4 rounded-lg border-4 border-border p-6",
        bg,
        "transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
        className
      )}
    >
      <Icon className={cn("h-10 w-10 flex-shrink-0", color)} />
      <div className="flex-1 space-y-1">
        {title && (
          <h3 className={cn("text-xl font-black", color)}>{title}</h3>
        )}
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  )
}

/**
 * Usage Examples:
 * 
 * // Basic usage
 * <StatusBadge status="accepted" />
 * 
 * // Compact variant
 * <StatusBadge status="wrong_answer" variant="compact" />
 * 
 * // Without icon
 * <StatusBadge status="compile_error" showIcon={false} />
 * 
 * // Icon only
 * <StatusIcon status="accepted" size={20} />
 * 
 * // Text only
 * <StatusText status="runtime_error" />
 * 
 * // Card style
 * <StatusCard
 *   status="accepted"
 *   title="All Tests Passed!"
 *   description="Your solution is correct and efficient."
 * />
 */
