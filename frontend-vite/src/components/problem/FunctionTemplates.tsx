import type React from "react"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

/**
 * Quick templates for common function patterns
 * Helps teachers quickly set up function configurations
 */

export interface FunctionTemplate {
  name: string
  description: string
  function_name: string
  return_type: string
  parameters: Array<{ name: string; type: string }>
  example_test_case: {
    inputs: Array<{ type: string; value: any }>
    expected_output: { type: string; value: any }
  }
}

const TEMPLATES: FunctionTemplate[] = [
  {
    name: "Two Sum",
    description: "Find two numbers that add up to target",
    function_name: "twoSum",
    return_type: "int[]",
    parameters: [
      { name: "nums", type: "int[]" },
      { name: "target", type: "int" }
    ],
    example_test_case: {
      inputs: [
        { type: "int[]", value: [2, 7, 11, 15] },
        { type: "int", value: 9 }
      ],
      expected_output: { type: "int[]", value: [0, 1] }
    }
  },
  {
    name: "Fibonacci",
    description: "Calculate nth Fibonacci number",
    function_name: "fibonacci",
    return_type: "int",
    parameters: [
      { name: "n", type: "int" }
    ],
    example_test_case: {
      inputs: [{ type: "int", value: 5 }],
      expected_output: { type: "int", value: 5 }
    }
  },
  {
    name: "Sum Array",
    description: "Calculate sum of array elements",
    function_name: "sumArray",
    return_type: "int",
    parameters: [
      { name: "arr", type: "int[]" }
    ],
    example_test_case: {
      inputs: [{ type: "int[]", value: [1, 2, 3, 4, 5] }],
      expected_output: { type: "int", value: 15 }
    }
  },
  {
    name: "Reverse String",
    description: "Reverse a string",
    function_name: "reverseString",
    return_type: "string",
    parameters: [
      { name: "s", type: "string" }
    ],
    example_test_case: {
      inputs: [{ type: "string", value: "hello" }],
      expected_output: { type: "string", value: "olleh" }
    }
  },
  {
    name: "Find Maximum",
    description: "Find maximum element in array",
    function_name: "findMax",
    return_type: "int",
    parameters: [
      { name: "nums", type: "int[]" }
    ],
    example_test_case: {
      inputs: [{ type: "int[]", value: [1, 5, 3, 9, 2] }],
      expected_output: { type: "int", value: 9 }
    }
  },
  {
    name: "Binary Search",
    description: "Search for target in sorted array",
    function_name: "binarySearch",
    return_type: "int",
    parameters: [
      { name: "nums", type: "int[]" },
      { name: "target", type: "int" }
    ],
    example_test_case: {
      inputs: [
        { type: "int[]", value: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
        { type: "int", value: 5 }
      ],
      expected_output: { type: "int", value: 4 }
    }
  },
  {
    name: "Is Palindrome",
    description: "Check if string is palindrome",
    function_name: "isPalindrome",
    return_type: "bool",
    parameters: [
      { name: "s", type: "string" }
    ],
    example_test_case: {
      inputs: [{ type: "string", value: "racecar" }],
      expected_output: { type: "bool", value: true }
    }
  },
  {
    name: "Sort Array",
    description: "Sort array in ascending order",
    function_name: "sortArray",
    return_type: "int[]",
    parameters: [
      { name: "nums", type: "int[]" }
    ],
    example_test_case: {
      inputs: [{ type: "int[]", value: [5, 2, 8, 1, 9] }],
      expected_output: { type: "int[]", value: [1, 2, 5, 8, 9] }
    }
  }
]

export interface FunctionTemplatesProps {
  onSelectTemplate: (template: FunctionTemplate) => void
}

export function FunctionTemplates({ onSelectTemplate }: FunctionTemplatesProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="border-4 border-purple-500 bg-purple-50 dark:bg-purple-950 p-4 shadow-[4px_4px_0px_0px_rgba(168,85,247,1)]">
        <div className="flex gap-3">
          <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-black text-lg uppercase text-purple-900 dark:text-purple-100">
              Quick Templates
            </p>
            <p className="text-sm font-bold text-purple-700 dark:text-purple-300 mt-2">
              Start with a common pattern and customize as needed
            </p>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((template) => (
          <Card
            key={template.function_name}
            className="border-4 border-border bg-card p-4 hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
            onClick={() => onSelectTemplate(template)}
          >
            <h3 className="font-black text-lg uppercase text-foreground mb-2">
              {template.name}
            </h3>
            <p className="text-sm font-bold text-muted-foreground mb-3">
              {template.description}
            </p>
            
            {/* Function signature preview */}
            <div className="bg-muted p-2 rounded border-2 border-border">
              <code className="text-xs font-mono">
                <span className="text-blue-600 dark:text-blue-400">{template.return_type}</span>
                {' '}
                <span className="font-black">{template.function_name}</span>
                (
                {template.parameters.map((p, i) => (
                  <span key={i}>
                    <span className="text-purple-600 dark:text-purple-400">{p.type}</span>
                    {' '}
                    {p.name}
                    {i < template.parameters.length - 1 ? ', ' : ''}
                  </span>
                ))}
                )
              </code>
            </div>

            {/* Use button */}
            <Button
              type="button"
              size="sm"
              className="w-full mt-3 border-4 border-border bg-purple-500 font-black uppercase text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0 hover:translate-y-0 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
              onClick={(e) => {
                e.stopPropagation()
                onSelectTemplate(template)
              }}
            >
              USE TEMPLATE
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
