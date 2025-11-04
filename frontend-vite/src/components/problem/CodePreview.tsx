import type React from "react"
import { Code2, Eye } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

/**
 * Code Preview Component
 * Shows how the function signature looks and how test cases will execute
 */

export interface CodePreviewProps {
  language: string
  functionName: string
  returnType: string
  parameters: Array<{ name: string; type: string }>
  testCase?: {
    inputs: Array<{ type: string; value: any }>
    expected_output: { type: string; value: any }
  }
}

export function CodePreview({
  language,
  functionName,
  returnType,
  parameters,
  testCase
}: CodePreviewProps) {
  
  const generateFunctionSignature = () => {
    if (language === 'cpp') {
      const params = parameters.map(p => `${p.type} ${p.name}`).join(', ')
      return `${returnType} ${functionName}(${params})`
    } else if (language === 'python') {
      const params = parameters.map(p => p.name).join(', ')
      return `def ${functionName}(${params}):`
    } else if (language === 'java') {
      const params = parameters.map(p => `${p.type} ${p.name}`).join(', ')
      return `public ${returnType} ${functionName}(${params})`
    }
    return ''
  }

  const generateTestCaseCode = () => {
    if (!testCase) return null

    if (language === 'cpp') {
      const inputsStr = testCase.inputs.map((input, idx) => {
        const paramName = parameters[idx]?.name || `param${idx}`
        if (typeof input.value === 'string') {
          return `string ${paramName} = "${input.value}";`
        } else if (Array.isArray(input.value)) {
          const values = input.value.join(', ')
          return `vector<${input.type.replace('[]', '').replace('vector<', '').replace('>', '')}> ${paramName} = {${values}};`
        } else {
          return `${input.type} ${paramName} = ${input.value};`
        }
      }).join('\n')

      const callArgs = parameters.map(p => p.name).join(', ')
      const expected = typeof testCase.expected_output.value === 'string'
        ? `"${testCase.expected_output.value}"`
        : Array.isArray(testCase.expected_output.value)
        ? `{${testCase.expected_output.value.join(', ')}}`
        : testCase.expected_output.value

      return `// Test Case Example
${inputsStr}

${returnType} result = ${functionName}(${callArgs});

// Expected: ${expected}
// Student's function should return: ${expected}`
    } else if (language === 'python') {
      const inputsStr = testCase.inputs.map((input, idx) => {
        const paramName = parameters[idx]?.name || `param${idx}`
        if (typeof input.value === 'string') {
          return `${paramName} = "${input.value}"`
        } else if (Array.isArray(input.value)) {
          return `${paramName} = ${JSON.stringify(input.value)}`
        } else {
          return `${paramName} = ${input.value}`
        }
      }).join('\n')

      const callArgs = parameters.map(p => p.name).join(', ')
      const expected = typeof testCase.expected_output.value === 'string'
        ? `"${testCase.expected_output.value}"`
        : JSON.stringify(testCase.expected_output.value)

      return `# Test Case Example
${inputsStr}

result = ${functionName}(${callArgs})

# Expected: ${expected}
# Student's function should return: ${expected}`
    }

    return null
  }

  return (
    <Card className="border-4 border-border bg-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-primary/10 p-2 rounded border-4 border-primary">
          <Code2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-black text-lg uppercase text-foreground">
            CODE PREVIEW
          </h3>
          <p className="text-sm font-bold text-muted-foreground">
            See how your configuration looks in code
          </p>
        </div>
      </div>

      <Tabs defaultValue="signature" className="w-full">
        <TabsList className="w-full border-4 border-border">
          <TabsTrigger value="signature" className="flex-1 font-black uppercase">
            Function Signature
          </TabsTrigger>
          {testCase && (
            <TabsTrigger value="testcase" className="flex-1 font-black uppercase">
              Test Case Example
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="signature" className="mt-4">
          <div className="bg-muted p-4 rounded border-4 border-border">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-primary/20 px-2 py-1 rounded border-2 border-primary text-xs font-black uppercase">
                {language}
              </span>
            </div>
            <pre className="font-mono text-sm overflow-x-auto">
              <code className="text-foreground font-bold">
                {generateFunctionSignature()}
              </code>
            </pre>
          </div>

          {/* Parameters info */}
          {parameters.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-black uppercase text-muted-foreground">
                Parameters:
              </p>
              <div className="space-y-1">
                {parameters.map((param, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="bg-muted px-2 py-1 rounded border-2 border-border font-mono font-bold">
                      {param.name}
                    </span>
                    <span className="text-muted-foreground">:</span>
                    <span className="text-primary font-mono font-bold">
                      {param.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {testCase && (
          <TabsContent value="testcase" className="mt-4">
            <div className="bg-muted p-4 rounded border-4 border-border">
              <pre className="font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                <code className="text-foreground font-bold">
                  {generateTestCaseCode()}
                </code>
              </pre>
            </div>

            {/* Visual representation */}
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="border-4 border-cyan-500 bg-cyan-50 dark:bg-cyan-950 p-3 rounded">
                <p className="text-xs font-black uppercase text-cyan-900 dark:text-cyan-100 mb-2">
                  📥 INPUT VALUES
                </p>
                <div className="space-y-1">
                  {testCase.inputs.map((input, idx) => (
                    <div key={idx} className="text-sm font-mono">
                      <span className="text-cyan-700 dark:text-cyan-300 font-bold">
                        {parameters[idx]?.name || `param${idx}`}:
                      </span>{' '}
                      <span className="text-cyan-900 dark:text-cyan-100">
                        {JSON.stringify(input.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-4 border-lime-500 bg-lime-50 dark:bg-lime-950 p-3 rounded">
                <p className="text-xs font-black uppercase text-lime-900 dark:text-lime-100 mb-2">
                  📤 EXPECTED OUTPUT
                </p>
                <div className="text-sm font-mono">
                  <span className="text-lime-700 dark:text-lime-300 font-bold">
                    return:
                  </span>{' '}
                  <span className="text-lime-900 dark:text-lime-100">
                    {JSON.stringify(testCase.expected_output.value)}
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </Card>
  )
}
