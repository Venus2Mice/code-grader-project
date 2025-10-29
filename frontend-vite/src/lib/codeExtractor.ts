/**
 * Utilities for extracting method bodies from student code
 * 
 * Students edit templates that include class/function declarations,
 * but we only need to send the implementation to the grader
 */

/**
 * Find matching closing brace for an opening brace at given position
 */
function findClosingBrace(code: string, openPos: number): number {
  let depth = 1
  for (let i = openPos + 1; i < code.length; i++) {
    if (code[i] === '{') depth++
    else if (code[i] === '}') {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

/**
 * Extract method body from Java code
 * Finds the method between braces and returns just the body
 */
export function extractJavaMethodBody(code: string): string {
  // Find "public" keyword for method declaration
  const publicIdx = code.indexOf('public ')
  if (publicIdx === -1) return code
  
  // Find the opening brace of the method
  const openBraceIdx = code.indexOf('{', publicIdx)
  if (openBraceIdx === -1) return code
  
  // Find the matching closing brace
  const closeBraceIdx = findClosingBrace(code, openBraceIdx)
  if (closeBraceIdx === -1) return code
  
  // Extract content between braces
  const body = code.substring(openBraceIdx + 1, closeBraceIdx)
  return body.trim()
}

/**
 * Extract function body from Python code
 * Finds the function between def and the end, returns just the body
 */
export function extractPythonFunctionBody(code: string): string {
  // Find the def line
  const defMatch = code.match(/def\s+\w+\s*\([^)]*\)\s*:\s*([\s\S]*)/)
  
  if (defMatch && defMatch[1]) {
    // Remove trailing pass and whitespace
    let body = defMatch[1].trim()
    // Remove "pass" if it's the only statement
    if (body === 'pass') {
      return ''
    }
    return body
  }
  
  // Fallback: return as-is if we can't parse
  return code
}

/**
 * Extract function body from C++ code
 * Finds the function body between braces
 */
export function extractCppFunctionBody(code: string): string {
  // Find first function that looks like our template
  // Look for pattern: returnType functionName(...) {
  const match = code.match(/[\w<>:]+\s+(\w+)\s*\([^)]*\)\s*\{/)
  if (!match) return code
  
  const openBraceIdx = match[0].lastIndexOf('{')
  const absoluteOpenIdx = (code.indexOf(match[0]) || 0) + openBraceIdx
  
  // Find the matching closing brace
  const closeBraceIdx = findClosingBrace(code, absoluteOpenIdx)
  if (closeBraceIdx === -1) return code
  
  // Extract content between braces
  const body = code.substring(absoluteOpenIdx + 1, closeBraceIdx)
  return body.trim()
}

/**
 * Extract just the implementation from student code
 * Returns only the method/function body without the declaration
 */
export function extractImplementation(code: string, language: string): string {
  const lang = language.toLowerCase()
  
  switch (lang) {
    case 'java':
      return extractJavaMethodBody(code)
    case 'python':
      return extractPythonFunctionBody(code)
    case 'cpp':
    case 'c++':
      return extractCppFunctionBody(code)
    default:
      return code
  }
}
