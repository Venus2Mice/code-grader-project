"use client"

import { useState, useEffect } from "react"
import type { Problem } from "@/types/problem"

const DEFAULT_CPP_CODE = `#include <iostream>
#include <vector>
using namespace std;

int main() {
    // Write your solution here
    
    return 0;
}`

interface UseCodeEditorProps {
  problem: Problem | null
}

export function useCodeEditor({ problem }: UseCodeEditorProps) {
  const [code, setCode] = useState(DEFAULT_CPP_CODE)
  const [language, setLanguage] = useState("cpp")
  const [originalTemplate, setOriginalTemplate] = useState("")

  useEffect(() => {
    if (!problem) return

    // Load function template if problem is in function mode
    if (problem.grading_mode === 'function' && problem.function_signature) {
      const signature = problem.function_signature
      let templateCode = ''
      
      if (signature.includes('def ') || signature.includes('->')) {
        // Python function
        setLanguage('python')
        templateCode = `${signature}\n    # Write your solution here\n    pass\n`
      } else if (signature.includes('function ') || signature.includes('=>')) {
        // JavaScript function
        setLanguage('javascript')
        templateCode = `${signature} {\n    // Write your solution here\n}\n`
      } else if (signature.includes('public ') && signature.includes('class ')) {
        // Java function
        setLanguage('java')
        templateCode = `${signature}\n        // Write your solution here\n    }\n}\n`
      } else {
        // C++ or C function (default)
        setLanguage('cpp')
        templateCode = `${signature} {\n    // Write your solution here\n}\n`
      }
      
      setCode(templateCode)
      setOriginalTemplate(templateCode)
    } else {
      setOriginalTemplate(DEFAULT_CPP_CODE)
    }
  }, [problem])

  const resetCode = () => {
    setCode(originalTemplate || DEFAULT_CPP_CODE)
  }

  const loadCode = (newCode: string) => {
    setCode(newCode)
  }

  return {
    code,
    setCode,
    language,
    setLanguage,
    originalTemplate,
    resetCode,
    loadCode
  }
}
