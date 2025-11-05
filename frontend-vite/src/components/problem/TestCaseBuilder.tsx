import type React from "react"
import { useState } from "react"
import { Plus, Trash2, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"

/**
 * Test Case Input/Output Builder
 * User-friendly UI for building test case inputs and expected outputs
 * No need to manually write JSON!
 */

export interface TestValue {
  type: string
  value: any
}

export interface TestCaseBuilderProps {
  inputs: TestValue[]
  expectedOutput: TestValue
  onInputsChange: (inputs: TestValue[]) => void
  onExpectedOutputChange: (output: TestValue) => void
  parameterNames?: string[]  // Optional: names from function signature
}

// Common type options - Simplified for clarity
const TYPE_OPTIONS = [
  { value: "int", label: "Integer" },
  { value: "float", label: "Float" },
  { value: "string", label: "String" },
  { value: "bool", label: "Boolean" },
  { value: "int[]", label: "Integer Array" },
  { value: "string[]", label: "String Array" },
]

export function TestCaseBuilder({
  inputs,
  expectedOutput,
  onInputsChange,
  onExpectedOutputChange,
  parameterNames = []
}: TestCaseBuilderProps) {
  
  const addInput = () => {
    const newInput: TestValue = { type: "int", value: 0 }
    onInputsChange([...inputs, newInput])
  }

  const removeInput = (index: number) => {
    if (inputs.length > 1) {
      onInputsChange(inputs.filter((_, i) => i !== index))
    }
  }

  const updateInput = (index: number, field: 'type' | 'value', value: any) => {
    const updated = inputs.map((input, i) => {
      if (i === index) {
        if (field === 'type') {
          // Reset value when type changes
          return { ...input, type: value, value: getDefaultValueForType(value) }
        }
        return { ...input, [field]: value }
      }
      return input
    })
    onInputsChange(updated)
  }

  const updateExpectedOutput = (field: 'type' | 'value', value: any) => {
    if (field === 'type') {
      onExpectedOutputChange({ type: value, value: getDefaultValueForType(value) })
    } else {
      onExpectedOutputChange({ ...expectedOutput, [field]: value })
    }
  }

  const getDefaultValueForType = (type: string): any => {
    if (type.includes('[]') || type.includes('vector') || type.includes('List')) {
      return '[]'
    }
    if (type === 'bool') return false
    if (type === 'string') return ''
    if (type === 'float') return 0.0
    return 0
  }

  return (
    <div className="space-y-6">
      {/* INPUTS Section */}
      <div className="border-4 border-border bg-muted/30 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-black uppercase tracking-wide">
            📥 INPUTS ({inputs.length})
          </h4>
          <Button 
            type="button" 
            onClick={addInput}
            size="sm"
            className="border-4 border-border bg-lime-500 px-4 py-2 font-black uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            ADD INPUT
          </Button>
        </div>

        <div className="space-y-4">
          {inputs.map((input, index) => (
            <Card key={index} className="border-4 border-border bg-background p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-3">
                  {/* Parameter name hint */}
                  {parameterNames[index] && (
                    <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                      <span className="bg-primary/10 px-2 py-1 rounded border-2 border-primary font-mono">
                        {parameterNames[index]}
                      </span>
                      <span>parameter {index + 1}</span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-[300px_1fr] gap-3">
                    {/* Type Selector */}
                    <div className="space-y-2">
                      <Label className="text-sm font-black uppercase">Type</Label>
                      <Select
                        value={input.type}
                        onValueChange={(value) => updateInput(index, 'type', value)}
                      >
                        <SelectTrigger className="border-4 border-border font-mono font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TYPE_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value} className="font-mono">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Value Input */}
                    <div className="space-y-2">
                      <Label className="text-sm font-black uppercase">Value</Label>
                      <Input
                        placeholder={input.type.includes('[]') ? '[1, 2, 3]' : 'Enter value'}
                        value={input.value}
                        onChange={(e) => updateInput(index, 'value', e.target.value)}
                        className="border-4 border-border font-mono font-bold"
                        required
                      />
                    </div>
                  </div>

                  {/* Helper text */}
                  <p className="text-xs text-muted-foreground">
                    {input.type.includes('[]') || input.type.includes('vector') || input.type.includes('List')
                      ? '💡 For arrays, use JSON format: [1, 2, 3] or ["a", "b", "c"]'
                      : `💡 Enter ${input.type} value directly`}
                  </p>
                </div>

                {/* Remove button */}
                {inputs.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removeInput(index)}
                    size="sm"
                    className="border-4 border-border bg-red-500 p-2 font-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* EXPECTED OUTPUT Section */}
      <div className="border-4 border-border bg-muted/30 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h4 className="text-lg font-black uppercase tracking-wide mb-4">
          📤 EXPECTED OUTPUT
        </h4>

        <Card className="border-4 border-border bg-background p-4">
          <div className="grid grid-cols-[300px_1fr] gap-3">
            {/* Type Selector */}
            <div className="space-y-2">
              <Label className="text-sm font-black uppercase">Type</Label>
              <Select
                value={expectedOutput.type}
                onValueChange={(value) => updateExpectedOutput('type', value)}
              >
                <SelectTrigger className="border-4 border-border font-mono font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="font-mono">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Value Input */}
            <div className="space-y-2">
              <Label className="text-sm font-black uppercase">Value</Label>
              <Input
                placeholder={expectedOutput.type.includes('[]') ? '[1, 2, 3]' : 'Enter expected value'}
                value={expectedOutput.value}
                onChange={(e) => updateExpectedOutput('value', e.target.value)}
                className="border-4 border-border font-mono font-bold"
                required
              />
            </div>
          </div>

          {/* Helper text */}
          <p className="text-xs text-muted-foreground mt-3">
            {expectedOutput.type.includes('[]') || expectedOutput.type.includes('vector') || expectedOutput.type.includes('List')
              ? '💡 For arrays, use JSON format: [1, 2, 3] or ["a", "b", "c"]'
              : `💡 Enter ${expectedOutput.type} value directly`}
          </p>
        </Card>
      </div>

      {/* JSON Preview (for debugging/advanced users) */}
      <details className="border-4 border-border bg-muted/10 p-4">
        <summary className="cursor-pointer font-black uppercase text-sm text-muted-foreground hover:text-foreground">
          🔍 Advanced: View JSON (Optional)
        </summary>
        <div className="mt-3 space-y-2">
          <div>
            <Label className="text-xs font-bold">Inputs JSON:</Label>
            <pre className="mt-1 bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
              {JSON.stringify(inputs, null, 2)}
            </pre>
          </div>
          <div>
            <Label className="text-xs font-bold">Expected Output JSON:</Label>
            <pre className="mt-1 bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
              {JSON.stringify(expectedOutput, null, 2)}
            </pre>
          </div>
        </div>
      </details>
    </div>
  )
}
