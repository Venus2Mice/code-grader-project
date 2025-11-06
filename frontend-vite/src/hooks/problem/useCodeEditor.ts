
import { useState, useEffect } from "react"
import type { Problem } from "@/types"
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

// Helper functions for type conversion
const convertTypeToJava = (type: string): string => {
  const typeMap: Record<string, string> = {
    'int': 'int',
    'int[]': 'int[]',
    'string': 'String',
    'string[]': 'String[]',
    'bool': 'boolean',
    'void': 'void',
    'char[]': 'char[]',
    'double': 'double',
    'double[]': 'double[]'
  }
  return typeMap[type] || type
}

const convertTypeToCpp = (type: string): string => {
  const typeMap: Record<string, string> = {
    'int': 'int',
    'int[]': 'vector<int>',
    'string': 'string',
    'string[]': 'vector<string>',
    'bool': 'bool',
    'void': 'void',
    'char[]': 'vector<char>&',
    'double': 'double',
    'double[]': 'vector<double>'
  }
  return typeMap[type] || type
}

const getDefaultValue = (type: string): string => {
  if (type.includes('[]') || type.includes('vector')) return '{}'
  if (type === 'int' || type === 'double') return '0'
  if (type === 'bool' || type === 'boolean') return 'false'
  if (type === 'String' || type === 'string') return '""'
  return 'null'
}

export function useCodeEditor({ problem }: UseCodeEditorProps) {
  const [code, setCode] = useState(DEFAULT_CPP_CODE)
  const [language, setLanguage] = useState("cpp")
  const [originalTemplate, setOriginalTemplate] = useState("")

  // Helper function to generate template based on language and problem metadata
  const generateTemplate = (lang: string, signature?: string): string => {
    // If problem has function metadata (function_name, return_type, parameters), use them
    if (problem && problem.function_name && problem.return_type) {
      const funcName = problem.function_name
      const returnType = problem.return_type
      const params = problem.parameters || []
      
      if (lang === 'python') {
        // Generate Python Solution class
        const paramStr = params.map((p: any) => p.name).join(', ')
        const typingImports = returnType.includes('[]') || params.some((p: any) => p.type.includes('[]')) 
          ? 'from typing import List, Optional\n\n' 
          : ''
        
        return `${typingImports}class Solution:
    def ${funcName}(self, ${paramStr}):
        # Write your solution here
        pass
`
      } else if (lang === 'java') {
        // Generate Java Solution class
        const javaReturnType = convertTypeToJava(returnType)
        const javaParams = params.map((p: any) => 
          `${convertTypeToJava(p.type)} ${p.name}`
        ).join(', ')
        
        return `import java.util.*;

class Solution {
    public ${javaReturnType} ${funcName}(${javaParams}) {
        // Write your solution here
        ${returnType === 'void' ? '' : `return ${getDefaultValue(javaReturnType)};`}
    }
}
`
      } else {
        // C++
        const cppReturnType = convertTypeToCpp(returnType)
        const cppParams = params.map((p: any) => 
          `${convertTypeToCpp(p.type)} ${p.name}`
        ).join(', ')
        
        return `#include <iostream>
#include <vector>
#include <string>
using namespace std;

class Solution {
public:
    ${cppReturnType} ${funcName}(${cppParams}) {
        // Write your solution here
        ${returnType === 'void' ? '' : `return ${getDefaultValue(cppReturnType)};`}
    }
};
`
      }
    }
    
    // Fallback to old logic if no metadata
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
    
    // Only update code if it's still the original template or empty
    // This prevents overwriting user's code when they change language
    if (code === originalTemplate || code.trim() === '' || !code) {
      setCode(newTemplate)
    }
    
    setOriginalTemplate(newTemplate)
  }, [language, problem])

  // Initialize template based on problem and detected language
  useEffect(() => {
    if (!problem) return

    // Use problem.language to set initial language
    const initialLang = problem.language || 'cpp'
    setLanguage(initialLang)
    
    // Generate template based on problem metadata
    const newTemplate = generateTemplate(initialLang, problem.function_signature)
    setCode(newTemplate)
    setOriginalTemplate(newTemplate)
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
