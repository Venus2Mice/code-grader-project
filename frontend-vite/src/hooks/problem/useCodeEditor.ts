
import { useState, useEffect } from "react"
import type { Problem } from "@/types/problem"
import { convertSignatureToLanguage, detectSignatureLanguage } from "@/lib/signatureConverter"

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

  // Helper function to generate template based on language and function signature
  const generateTemplate = (lang: string, signature?: string): string => {
    if (!signature) {
      // No function signature, return default template based on language
      const templates: Record<string, string> = {
        cpp: DEFAULT_CPP_CODE,
        python: DEFAULT_PYTHON_CODE,
        java: DEFAULT_JAVA_CODE
      }
      return templates[lang] || DEFAULT_CPP_CODE
    }

    // Has function signature, generate language-specific template
    const sig = signature.trim()
    if (lang === 'python') {
      return `from typing import List, Optional

${sig}
    # Write your solution here
    pass
`
    } else if (lang === 'java') {
      const javaSig = convertSignatureToLanguage(sig, 'java')
      return `import java.util.*;

class Solution {
    ${javaSig} {
        // Write your solution here
        
    }
}
`
    } else {
      // C++
      const cppSig = convertSignatureToLanguage(sig, 'cpp')
      return `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

class Solution {
public:
    ${cppSig} {
        // Write your solution here
        
    }
};
`
    }
  }


  // Update code when language changes
  useEffect(() => {
    if (!problem) return

    // Generate template for the selected language
    const newTemplate = generateTemplate(language, problem.function_signature)
    setCode(newTemplate)
    setOriginalTemplate(newTemplate)
  }, [language, problem])

  // Initialize template based on problem and detected language
  useEffect(() => {
    if (!problem) return

    // Detect language from function signature and set it
    if (problem.function_signature) {
      const signature = problem.function_signature.trim()
      
      // Detect language from signature
      const detectedLang = detectSignatureLanguage(signature) || 'python'
      
      // Update language and template
      setLanguage(detectedLang)
      const newTemplate = generateTemplate(detectedLang, signature)
      setCode(newTemplate)
      setOriginalTemplate(newTemplate)
    } else {
      // No function signature, use default C++ template
      setLanguage('cpp')
      setCode(DEFAULT_CPP_CODE)
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
