/**
 * Skeleton Loading Components
 * Các component skeleton cho các trang khác nhau
 */

import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

/**
 * Skeleton cho Problem Card (dùng trong class listing)
 */
export function ProblemCardSkeleton() {
  return (
    <Card className="border-4 border-border bg-card p-6">
      <div className="space-y-4">
        {/* Title */}
        <Skeleton className="h-8 w-3/4" />
        
        {/* Difficulty badge */}
        <Skeleton className="h-6 w-20" />
        
        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        
        {/* Stats */}
        <div className="flex gap-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-24" />
        </div>
        
        {/* Button */}
        <Skeleton className="h-10 w-full" />
      </div>
    </Card>
  )
}

/**
 * Skeleton cho Class Card
 */
export function ClassCardSkeleton() {
  return (
    <Card className="border-4 border-border bg-card p-6">
      <div className="space-y-4">
        {/* Title */}
        <Skeleton className="h-7 w-2/3" />
        
        {/* Class code */}
        <Skeleton className="h-5 w-32" />
        
        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        
        {/* Stats */}
        <div className="flex justify-between">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-28" />
        </div>
      </div>
    </Card>
  )
}

/**
 * Skeleton cho Submission Row (trong bảng submissions)
 */
export function SubmissionRowSkeleton() {
  return (
    <div className="flex items-center justify-between border-b-2 border-border p-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  )
}

/**
 * Skeleton cho Problem Detail Page
 */
export function ProblemDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <Skeleton className="h-10 w-2/3" />
        <div className="flex gap-3">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-7 w-32" />
        </div>
      </div>
      
      {/* Description */}
      <Card className="border-4 border-border p-6">
        <div className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      </Card>
      
      {/* Test Cases */}
      <Card className="border-4 border-border p-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2 border-t-2 border-border pt-4">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

/**
 * Skeleton cho Code Editor Section
 */
export function CodeEditorSkeleton() {
  return (
    <Card className="border-4 border-border p-6">
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
        
        {/* Editor */}
        <Skeleton className="h-96 w-full" />
        
        {/* Actions */}
        <div className="flex gap-3">
          <Skeleton className="h-11 w-32" />
          <Skeleton className="h-11 w-32" />
        </div>
      </div>
    </Card>
  )
}

/**
 * Skeleton cho Test Results Panel
 */
export function TestResultsSkeleton() {
  return (
    <Card className="border-4 border-border p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-7 w-28" />
        </div>
        
        {/* Test cases */}
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between border-2 border-border p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

/**
 * Skeleton cho Leaderboard
 */
export function LeaderboardSkeleton() {
  return (
    <Card className="border-4 border-border">
      <div className="divide-y-2 divide-border">
        {/* Header */}
        <div className="flex items-center justify-between bg-primary p-4">
          <Skeleton className="h-6 w-32 bg-primary-foreground/20" />
          <Skeleton className="h-6 w-24 bg-primary-foreground/20" />
        </div>
        
        {/* Rows */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-8" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="space-y-2 text-right">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

/**
 * Skeleton cho Stats Cards (Dashboard)
 */
export function StatsCardSkeleton() {
  return (
    <Card className="border-4 border-border p-6">
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-4 w-40" />
      </div>
    </Card>
  )
}

/**
 * Grid Layout cho Problem Cards
 */
export function ProblemGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProblemCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Grid Layout cho Class Cards
 */
export function ClassGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ClassCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * List Layout cho Submissions
 */
export function SubmissionListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <Card className="border-4 border-border">
      {Array.from({ length: count }).map((_, i) => (
        <SubmissionRowSkeleton key={i} />
      ))}
    </Card>
  )
}
