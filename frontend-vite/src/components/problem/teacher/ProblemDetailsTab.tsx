
import { Card } from "@/components/ui/card"
import type { Problem } from "@/types/problem"

// Helper function to format structured test case data for display
function formatTestCaseData(data: any, isInput: boolean = false, functionSig?: string): string {
  if (!data) return "(empty)"
  
  // Handle array of inputs (LeetCode-style format)
  if (Array.isArray(data)) {
    if (data.length === 0) return "(empty)"
    
    // Extract parameter names from function signature if available
    let paramNames: string[] = []
    if (isInput && functionSig) {
      // Parse parameter names from signature
      const match = functionSig.match(/\(([^)]*)\)/)
      if (match) {
        const params = match[1].split(',').map(p => {
          // Extract just the parameter name
          const parts = p.trim().split(/\s+/)
          return parts[parts.length - 1].replace(/[&*]/g, '')
        })
        paramNames = params
      }
    }
    
    // Format each input with parameter name
    return data.map((input: any, idx: number) => {
      const paramName = paramNames[idx] || `param${idx + 1}`
      if (input.type && input.value !== undefined) {
        const value = typeof input.value === 'string' 
          ? `"${input.value}"` 
          : JSON.stringify(input.value)
        return `${paramName} = ${value}`
      }
      return `${paramName} = ${JSON.stringify(input)}`
    }).join('\n')
  }
  
  // Handle single output object
  if (data.type && data.value !== undefined) {
    const value = typeof data.value === 'string'
      ? `"${data.value}"`
      : JSON.stringify(data.value)
    return value
  }
  
  // Fallback to JSON stringify with formatting
  return JSON.stringify(data, null, 2)
}

interface ProblemDetailsTabProps {
  problem: Problem
}

export function ProblemDetailsTab({ problem }: ProblemDetailsTabProps) {
  return (
    <Card className="border-4 border-border bg-card p-6">
      <h2 className="mb-4 text-xl font-semibold text-foreground">Problem Configuration</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">Time Limit</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {problem.time_limit_ms || problem.time_limit || 1000}ms
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Memory Limit</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {Math.round((problem.memory_limit_kb || problem.memory_limit || 256000) / 1024)}MB
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Grading Mode</p>
            <p className="mt-1 text-sm text-muted-foreground uppercase">
              {problem.grading_mode || 'stdio'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Test Cases</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {problem.test_cases?.length || 0} cases
            </p>
          </div>
        </div>

        {problem.function_signature && (
          <div>
            <p className="text-sm font-medium text-foreground">Function Signature</p>
            <pre className="mt-2 rounded-lg bg-muted p-3 text-sm text-foreground">
              {problem.function_signature}
            </pre>
          </div>
        )}

        <div>
          <p className="mb-3 text-sm font-medium text-foreground">Test Cases</p>
          <div className="space-y-2">
            {problem.test_cases?.map((testCase: any, index: number) => (
              <Card key={testCase.id} className="border-border bg-muted/50 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">Test Case {index + 1}</p>
                      {testCase.is_hidden && (
                        <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-500">
                          Hidden
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {testCase.points || 10} points
                      </span>
                    </div>
                    <div className="mt-2 grid gap-2 text-xs">
                      <div>
                        <span className="font-medium text-foreground">Input:</span>
                        <pre className="mt-1 rounded bg-background p-2 text-muted-foreground">
                          {formatTestCaseData(testCase.inputs)}
                        </pre>
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Expected Output:</span>
                        <pre className="mt-1 rounded bg-background p-2 text-muted-foreground">
                          {formatTestCaseData(testCase.expected_output)}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
