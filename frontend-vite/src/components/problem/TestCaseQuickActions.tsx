import type React from "react"
import { Copy, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

/**
 * Quick actions for test cases
 * - Duplicate test case
 * - Generate similar test cases
 * - Distribute points evenly
 */

export interface TestCase {
  id: string
  inputs: Array<{ type: string; value: any }>
  expected_output: { type: string; value: any }
  is_hidden: boolean
  points: number
}

export interface QuickActionsProps {
  testCase: TestCase
  totalTestCases: number
  onDuplicate: () => void
  onDistributePoints: () => void
}

export function TestCaseQuickActions({ 
  testCase, 
  totalTestCases,
  onDuplicate,
  onDistributePoints
}: QuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {/* Duplicate button */}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onDuplicate}
        className="border-4 border-border bg-cyan-500 px-3 py-1 font-black uppercase text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
      >
        <Copy className="h-4 w-4 mr-2" />
        DUPLICATE
      </Button>

      {/* Distribute points button */}
      {totalTestCases > 1 && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onDistributePoints}
          className="border-4 border-border bg-lime-500 px-3 py-1 font-black uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
        >
          <Zap className="h-4 w-4 mr-2" />
          EVEN POINTS
        </Button>
      )}
    </div>
  )
}

/**
 * Batch actions for all test cases
 */
export interface BatchActionsProps {
  testCaseCount: number
  totalPoints: number
  onDistributeAll: () => void
  onSetAllVisible: () => void
  onSetAllHidden: () => void
}

export function TestCaseBatchActions({
  testCaseCount,
  totalPoints,
  onDistributeAll,
  onSetAllVisible,
  onSetAllHidden
}: BatchActionsProps) {
  const pointsPerCase = Math.floor(100 / testCaseCount)
  
  return (
    <Card className="border-4 border-border bg-yellow-50 dark:bg-yellow-950 p-4 shadow-[4px_4px_0px_0px_rgba(234,179,8,1)]">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <span className="font-black text-sm uppercase text-yellow-900 dark:text-yellow-100">
            Quick Actions:
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            onClick={onDistributeAll}
            className="border-4 border-border bg-lime-500 px-3 py-1 font-black uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            DISTRIBUTE POINTS ({pointsPerCase} each)
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onSetAllVisible}
            className="border-4 border-border bg-green-500 px-3 py-1 font-black uppercase text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            SET ALL VISIBLE
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onSetAllHidden}
            className="border-4 border-border bg-orange-500 px-3 py-1 font-black uppercase text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            SET ALL HIDDEN
          </Button>
        </div>
      </div>

      {totalPoints !== 100 && (
        <p className="text-xs font-bold text-yellow-700 dark:text-yellow-300 mt-2">
          💡 Current total: {totalPoints}/100 points
        </p>
      )}
    </Card>
  )
}
