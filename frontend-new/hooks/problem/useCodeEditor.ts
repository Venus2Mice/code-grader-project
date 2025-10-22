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

const DEFAULT_PYTHON_CODE = `# Write your solution here

def main():
    # Your code here
    pass

if __name__ == "__main__":
    main()
`

const DEFAULT_JAVA_CODE = `import java.util.*;

public class Main {
    public static void main(String[] args) {
        // Write your solution here
        
    }
}
`

interface UseCodeEditorProps {
  problem: Problem | null
}

export function useCodeEditor({ problem }: UseCodeEditorProps) {
  const [code, setCode] = useState(DEFAULT_CPP_CODE)
  const [language, setLanguage] = useState("cpp")
  const [originalTemplate, setOriginalTemplate] = useState("")

  // Update code template when language changes
  useEffect(() => {
    if (!problem || problem.grading_mode === 'function') return
    
    // Set default template based on language for stdio mode
    const templates: Record<string, string> = {
      cpp: DEFAULT_CPP_CODE,
      python: DEFAULT_PYTHON_CODE,
      java: DEFAULT_JAVA_CODE
    }
    
    const newTemplate = templates[language] || DEFAULT_CPP_CODE
    setCode(newTemplate)
    setOriginalTemplate(newTemplate)
  }, [language, problem])

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
