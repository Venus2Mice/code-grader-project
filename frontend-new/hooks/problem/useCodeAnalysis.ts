"use client"

import { useState } from "react"
import type { CodeAnalysis } from "@/types/problem"

export function useCodeAnalysis() {
  const analyzeCppCode = (code: string): CodeAnalysis => {
    // Remove comments to avoid false positives
    let cleanCode = code
      // Remove single-line comments
      .replace(/\/\/.*$/gm, '')
      // Remove multi-line comments
      .replace(/\/\*[\s\S]*?\*\//g, '')
    
    // Check for main function
    // Pattern: int main() or int main(int argc, char* argv[]) etc.
    const mainPattern = /\b(int|void)\s+main\s*\([^)]*\)\s*\{/g
    const hasMain = mainPattern.test(cleanCode)
    
    // Check for other function definitions (not just declarations)
    // Pattern: return_type function_name(...) { ... }
    const functionPattern = /\b(int|void|bool|double|float|long|short|char|string|vector|auto)\s+\w+\s*\([^)]*\)\s*\{/g
    const functionMatches = cleanCode.match(functionPattern) || []
    
    // Filter out main function from the count
    const nonMainFunctions = functionMatches.filter(match => !match.includes('main'))
    const hasFunctions = nonMainFunctions.length > 0
    
    // Generate analysis message
    let analysis = ""
    if (hasMain && hasFunctions) {
      analysis = `✅ Complete program detected:\n• Has main() function\n• Has ${nonMainFunctions.length} other function(s)\n• Ready for STDIO grading mode`
    } else if (hasMain && !hasFunctions) {
      analysis = `✅ Complete program detected:\n• Has main() function\n• No other functions\n• Ready for STDIO grading mode`
    } else if (!hasMain && hasFunctions) {
      analysis = `⚠️ Function-only code detected:\n• No main() function\n• Has ${nonMainFunctions.length} function(s)\n• Suitable for FUNCTION grading mode only\n\n⚠️ Note: If problem uses STDIO mode, this will fail!`
    } else {
      analysis = `❌ No valid code structure detected:\n• No main() function\n• No function definitions\n• Please check your code`
    }
    
    return { hasMain, hasFunctions, analysis }
  }

  return { analyzeCppCode }
}
