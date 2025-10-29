/**
 * Utilities for converting Python function signatures to other languages
 * Database stores function signatures in Python syntax, so we need to convert
 * them for display in the UI and code templates
 */

interface TypeMap {
  [key: string]: { java: string; cpp: string }
}

const TYPE_MAP: TypeMap = {
  'int': { java: 'int', cpp: 'int' },
  'float': { java: 'double', cpp: 'double' },
  'str': { java: 'String', cpp: 'string' },
  'bool': { java: 'boolean', cpp: 'bool' },
  'List[int]': { java: 'int[]', cpp: 'vector<int>' },
  'List[float]': { java: 'double[]', cpp: 'vector<double>' },
  'List[str]': { java: 'String[]', cpp: 'vector<string>' },
  'List[bool]': { java: 'boolean[]', cpp: 'vector<bool>' },
  'List[List[int]]': { java: 'int[][]', cpp: 'vector<vector<int>>' },
  'List[List[str]]': { java: 'String[][]', cpp: 'vector<vector<string>>' },
  'List[List[double]]': { java: 'double[][]', cpp: 'vector<vector<double>>' },
  'Optional[int]': { java: 'Integer', cpp: 'int' },
}

/**
 * Convert a single Python type to target language type
 */
function convertType(pyType: string, targetLang: 'java' | 'cpp'): string {
  const cleaned = pyType.trim()
  return TYPE_MAP[cleaned]?.[targetLang] || cleaned
}

/**
 * Convert a Python function signature to the target language syntax
 * 
 * Example:
 * Input (Python): "def twoSum(nums: List[int], target: int) -> List[int]:"
 * Output (Java): "public int[] twoSum(int[] nums, int target)"
 * Output (C++): "vector<int> twoSum(vector<int> nums, int target)"
 */
export function convertSignatureToLanguage(signature: string, targetLang: string): string {
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
  const pythonMatch = sig.match(/def\s+(\w+)\s*\((.*?)\)\s*->\s*(.+?):?\s*$/)
  if (!pythonMatch) {
    // Can't parse, return as-is
    return sig
  }
  
  const [, funcName, paramsStr, returnTypeRaw] = pythonMatch
  
  // Remove trailing colon if present
  const returnType = returnTypeRaw.trim().replace(/:$/, '')
  
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
  
  // Build signature in target language
  if (targetLang === 'java') {
    return `public ${retType} ${funcName}(${params})`
  } else {
    return `${retType} ${funcName}(${params})`
  }
}

/**
 * Get the language of a function signature
 * Returns: 'python' | 'java' | 'cpp' | 'unknown'
 */
export function detectSignatureLanguage(signature: string): 'python' | 'java' | 'cpp' | 'unknown' {
  const sig = signature.trim()
  
  // Python: starts with 'def' or contains '->'
  if (sig.includes('def ') || (sig.includes('->') && sig.includes(': List['))) {
    return 'python'
  }
  
  // Java: contains 'public' and type names like 'int[]', 'String[]', 'boolean'
  if (sig.includes('public ') && 
      (sig.includes('[]') || sig.includes('int ') || sig.includes('String ') || 
       sig.includes('boolean ') || sig.includes('double ') || sig.includes('long '))) {
    return 'java'
  }
  
  // C++: contains 'vector<' or doesn't contain 'public' or 'def'
  if (sig.includes('vector<') || (!sig.includes('def ') && !sig.includes('public '))) {
    return 'cpp'
  }
  
  return 'unknown'
}
