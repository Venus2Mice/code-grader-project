
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

  // Helper function to convert Python type hints to target language
  const convertSignature = (signature: string, targetLang: string): string => {
    const sig = signature.trim()
    
    // If signature is already in target language, return as-is
    if (targetLang === 'python' && sig.includes('def ')) {
      return sig
    }
    if (targetLang === 'java' && sig.includes('public ') && !sig.includes('def ')) {
      return sig
    }
    if (targetLang === 'cpp' && !sig.includes('def ') && !sig.includes('public ')) {
      return sig
    }
    
    // Parse Python signature: def functionName(param1: Type1, param2: Type2) -> ReturnType:
    const pythonMatch = sig.match(/def\s+(\w+)\s*\((.*?)\)\s*->\s*(.+):?/)
    if (!pythonMatch) return sig // Can't parse, return as-is
    
    const [, funcName, paramsStr, returnType] = pythonMatch
    
    // Type conversion map
    const typeMap: Record<string, { java: string; cpp: string }> = {
      'int': { java: 'int', cpp: 'int' },
      'float': { java: 'double', cpp: 'double' },
      'str': { java: 'String', cpp: 'string' },
      'bool': { java: 'boolean', cpp: 'bool' },
      'List[int]': { java: 'int[]', cpp: 'vector<int>' },
      'List[float]': { java: 'double[]', cpp: 'vector<double>' },
      'List[str]': { java: 'String[]', cpp: 'vector<string>' },
      'List[bool]': { java: 'boolean[]', cpp: 'vector<bool>' },
      'List[List[int]]': { java: 'int[][]', cpp: 'vector<vector<int>>' },
      'Optional[int]': { java: 'Integer', cpp: 'int' },
    }
    
    const convertType = (pyType: string, lang: 'java' | 'cpp'): string => {
      const cleaned = pyType.trim()
      return typeMap[cleaned]?.[lang] || cleaned
    }
    
    // Parse parameters
    const params = paramsStr.split(',').map(p => {
      const parts = p.trim().split(':')
      if (parts.length === 2) {
        const name = parts[0].trim()
        const type = parts[1].trim()
        if (targetLang === 'java') {
          return `${convertType(type, 'java')} ${name}`
        } else {
          return `${convertType(type, 'cpp')} ${name}`
        }
      }
      return p.trim()
    }).join(', ')
    
    // Convert return type
    const retType = targetLang === 'java' 
      ? convertType(returnType.trim(), 'java')
      : convertType(returnType.trim(), 'cpp')
    
    // Build signature
    if (targetLang === 'java') {
      return `public ${retType} ${funcName}(${params})`
    } else {
      return `${retType} ${funcName}(${params})`
    }
  }

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
      const javaSig = convertSignature(sig, 'java')
      return `import java.util.*;

class Solution {
    ${javaSig} {
        // Write your solution here
        
    }
}
`
    } else {
      // C++
      const cppSig = convertSignature(sig, 'cpp')
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
      let detectedLang = 'cpp'
      
      // Detect Python
      if (signature.includes('def ') || signature.includes('->') || signature.includes(': List[')) {
        detectedLang = 'python'
      } 
      // Detect Java
      else if (signature.includes('public ') && (signature.includes('class ') || signature.includes('void ') || signature.includes('int ') || signature.includes('boolean ') || signature.includes('String '))) {
        detectedLang = 'java'
      }
      
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
