
import { Card } from "@/components/ui/card"
import { MarkdownDisplay } from "@/components/problem/MarkdownDisplay"
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
    <div className="space-y-6">
      {/* Problem Description */}
      <Card className="border-3 border-blue-200 dark:border-blue-700 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-6 shadow-[4px_4px_0px_0px_rgba(59,130,246,0.15)]">
        <h2 className="mb-4 text-2xl font-black uppercase text-gray-900 dark:text-white">Problem Description</h2>
        <div className="bg-white dark:bg-gray-900 p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg">
          {problem.markdown_content ? (
            <MarkdownDisplay markdown={problem.markdown_content} />
          ) : (
            <p className="font-medium text-gray-800 dark:text-gray-200 leading-relaxed">{problem.description}</p>
          )}
        </div>
      </Card>

      {/* Problem Configuration */}
      <Card className="border-3 border-purple-200 dark:border-purple-700 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 p-6 shadow-[4px_4px_0px_0px_rgba(168,85,247,0.15)]">
        <h2 className="mb-4 text-2xl font-black uppercase text-gray-900 dark:text-white">Problem Configuration</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-900 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg">
              <p className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase">Time Limit</p>
              <p className="mt-2 text-lg font-black text-gray-900 dark:text-white">
                {problem.time_limit_ms || problem.time_limit || 1000}ms
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg">
              <p className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase">Memory Limit</p>
              <p className="mt-2 text-lg font-black text-gray-900 dark:text-white">
                {Math.round((problem.memory_limit_kb || problem.memory_limit || 256000) / 1024)}MB
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg">
              <p className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase">Grading Mode</p>
              <p className="mt-2 text-lg font-black text-gray-900 dark:text-white uppercase">
                {problem.grading_mode || 'stdio'}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg">
              <p className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase">Test Cases</p>
              <p className="mt-2 text-lg font-black text-gray-900 dark:text-white">
                {problem.test_cases?.length || 0} cases
              </p>
            </div>
          </div>

          {problem.function_signature && (
            <div className="bg-white dark:bg-gray-900 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg">
              <p className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase mb-3">Function Signature</p>
              <pre className="rounded-lg bg-gray-50 dark:bg-gray-800 p-4 text-sm font-mono text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700">
                {problem.function_signature}
              </pre>
            </div>
          )}

          <div className="bg-white dark:bg-gray-900 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg">
            <p className="mb-4 text-sm font-bold text-gray-600 dark:text-gray-400 uppercase">Test Cases</p>
            <div className="space-y-3">
              {problem.test_cases?.map((testCase: any, index: number) => (
                <Card key={testCase.id} className="border-2 border-gray-300 dark:border-gray-600 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <p className="text-sm font-black text-gray-900 dark:text-white uppercase">Test Case {index + 1}</p>
                        {testCase.is_hidden && (
                          <span className="border-2 border-orange-400 dark:border-orange-600 rounded-full bg-orange-100 dark:bg-orange-900/50 px-3 py-1 text-xs font-bold uppercase text-orange-700 dark:text-orange-300">
                            Hidden
                          </span>
                        )}
                        <span className="border-2 border-emerald-400 dark:border-emerald-600 rounded-full bg-emerald-100 dark:bg-emerald-900/50 px-3 py-1 text-xs font-bold uppercase text-emerald-700 dark:text-emerald-300">
                          {testCase.points || 10} points
                        </span>
                      </div>
                      <div className="space-y-3 text-xs">
                        <div>
                          <span className="font-bold text-gray-900 dark:text-white uppercase">Input:</span>
                          <pre className="mt-2 rounded-lg bg-white dark:bg-gray-800 p-3 text-gray-800 dark:text-gray-200 font-mono border border-gray-200 dark:border-gray-700">
                            {formatTestCaseData(testCase.inputs)}
                          </pre>
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 dark:text-white uppercase">Expected Output:</span>
                          <pre className="mt-2 rounded-lg bg-white dark:bg-gray-800 p-3 text-gray-800 dark:text-gray-200 font-mono border border-gray-200 dark:border-gray-700">
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
    </div>
  )
}
