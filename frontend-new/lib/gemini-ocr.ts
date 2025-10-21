/**
 * Gemini OCR Service - Trích xuất code từ hình ảnh sử dụng Google Gemini API
 * Frontend-only implementation (no backend required)
 */

import { logger } from './logger';

export interface OCRResult {
  success: boolean;
  code: string | null;
  error: string | null;
  warnings: string[];
  confidence: 'high' | 'medium' | 'low' | 'none';
}

export interface OCROptions {
  language?: string;
  apiKey?: string;
}

/**
 * Convert file to base64 string
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Clean markdown code blocks from response
 */
function cleanMarkdown(text: string): string {
  let cleaned = text.trim();
  
  // Remove starting ``` or ```language
  const lines = cleaned.split('\n');
  if (lines[0]?.trim().startsWith('```')) {
    lines.shift();
  }
  
  // Remove ending ```
  if (lines[lines.length - 1]?.trim() === '```') {
    lines.pop();
  }
  
  return lines.join('\n');
}

/**
 * Detect warnings in extracted code
 */
function detectWarnings(code: string, language: string): string[] {
  const warnings: string[] = [];
  
  // Check for error markers
  const errorMarkers = ['# ERROR:', '// ERROR:', '/* ERROR:', '<!-- ERROR:'];
  errorMarkers.forEach(marker => {
    if (code.includes(marker)) {
      const errorLines = code.split('\n').filter(line => line.includes(marker));
      warnings.push(...errorLines.map(line => line.trim()));
    }
  });
  
  // Language-specific checks
  if (language.toLowerCase() === 'python') {
    if ((code.match(/\(/g) || []).length !== (code.match(/\)/g) || []).length) {
      warnings.push('WARNING: Unbalanced parentheses detected');
    }
    if ((code.match(/\[/g) || []).length !== (code.match(/\]/g) || []).length) {
      warnings.push('WARNING: Unbalanced square brackets detected');
    }
  } else if (['cpp', 'c', 'java', 'javascript'].includes(language.toLowerCase())) {
    if ((code.match(/\{/g) || []).length !== (code.match(/\}/g) || []).length) {
      warnings.push('WARNING: Unbalanced curly braces detected');
    }
  }
  
  return warnings;
}

/**
 * Check if extracted text contains actual code
 */
function containsCode(text: string): boolean {
  if (!text || text.trim().length < 5) return false;
  
  // Common code indicators
  const codeIndicators = [
    /def\s+\w+\s*\(/,           // Python function
    /class\s+\w+/,              // Class definition
    /function\s+\w+\s*\(/,      // JavaScript function
    /for\s*\(/,                 // For loop
    /while\s*\(/,               // While loop
    /if\s*\(/,                  // If statement
    /import\s+/,                // Import statement
    /from\s+\w+\s+import/,      // Python import
    /include\s*[<"]/,           // C/C++ include
    /console\.log/,             // JavaScript console
    /print\s*\(/,               // Print statement
    /return\s+/,                // Return statement
    /\w+\s*=\s*\w+/,            // Variable assignment
    /\w+\s*:\s*\w+/,            // Type annotation or dict
    /[{}\[\];]/,                // Code punctuation
    /\/\/|\/\*|\#/,             // Comments
  ];
  
  // Check if text matches any code pattern
  const hasCodePattern = codeIndicators.some(pattern => pattern.test(text));
  
  // Check for non-code indicators (common text in non-code images)
  const nonCodePhrases = [
    /no code found/i,
    /cannot find code/i,
    /image does not contain code/i,
    /not a code image/i,
    /this is not code/i,
    /unable to extract code/i,
  ];
  
  const hasNonCodePhrase = nonCodePhrases.some(pattern => pattern.test(text));
  
  return hasCodePattern && !hasNonCodePhrase;
}

/**
 * Assess confidence level of extraction
 */
function assessConfidence(code: string, warnings: string[]): 'high' | 'medium' | 'low' | 'none' {
  if (!code || code.length < 10) return 'low';
  if (warnings.length > 0) return warnings.length <= 2 ? 'medium' : 'low';
  if (code.length > 50 && !code.includes('ERROR:') && !code.includes('WARNING:')) {
    return 'high';
  }
  return 'medium';
}

/**
 * Extract code from image using Gemini API
 */
export async function extractCodeFromImage(
  imageFile: File,
  options: OCROptions = {}
): Promise<OCRResult> {
  const { language = 'python', apiKey } = options;
  
  // Get API key from env or parameter
  const GEMINI_API_KEY = apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!GEMINI_API_KEY) {
    return {
      success: false,
      code: null,
      error: 'GEMINI_API_KEY not configured. Please add NEXT_PUBLIC_GEMINI_API_KEY to .env.local',
      warnings: [],
      confidence: 'none',
    };
  }
  
  try {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(imageFile.type)) {
      return {
        success: false,
        code: null,
        error: `Invalid file type: ${imageFile.type}. Allowed: JPEG, PNG, GIF, WebP`,
        warnings: [],
        confidence: 'none',
      };
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (imageFile.size > maxSize) {
      return {
        success: false,
        code: null,
        error: `File too large (${(imageFile.size / 1024 / 1024).toFixed(2)}MB). Maximum: 10MB`,
        warnings: [],
        confidence: 'none',
      };
    }
    
    // Convert to base64
    const base64Data = await fileToBase64(imageFile);
    
    // Language hints
    const languageHints: Record<string, string> = {
      python: 'Python code with proper indentation',
      cpp: 'C++ code with proper syntax',
      c: 'C code with proper syntax',
      java: 'Java code with proper class structure',
      javascript: 'JavaScript code',
      typescript: 'TypeScript code',
    };
    
    const langHint = languageHints[language.toLowerCase()] || `${language} code`;
    
    const systemPrompt = `You are an expert code extraction and OCR system. Your task:

1. **Extract ALL code** from the image with 100% accuracy
2. **Preserve formatting**: indentation, spacing, line breaks
3. **Detect syntax errors**: missing brackets, semicolons, quotes, etc.
4. **Format properly** for ${langHint}
5. **Return clean code** without markdown formatting

Response format:
- If code is PERFECT: return only the clean formatted code
- If code has ERRORS: return the code with inline comments marking errors like:
  • Python: # ERROR: missing colon here
  • C/C++/Java: // ERROR: missing semicolon here
- If NO CODE found in image: return exactly "NO CODE FOUND"

CRITICAL RULES:
- NO markdown code blocks (no \`\`\`)
- NO explanations before or after the code
- NO "Here is the extracted code:" type messages
- ONLY return the actual code content
- If image contains text but NO programming code, return "NO CODE FOUND"
- Preserve ALL original code logic and structure`;

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: imageFile.type,
                    data: base64Data,
                  },
                },
                {
                  text: `Extract this ${language} code from the image. Check for syntax errors and formatting issues.`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            topP: 0.95,
            topK: 20,
            maxOutputTokens: 8192,
          },
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
        }),
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `API request failed: ${response.status} ${response.statusText}`
      );
    }
    
    const data = await response.json();
    
    // Extract text from response
    const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!extractedText) {
      throw new Error('No text extracted from image. Please try a clearer image.');
    }
    
    // Clean and process
    const cleanedCode = cleanMarkdown(extractedText);
    
    // Check if Gemini explicitly said no code found
    if (cleanedCode.trim().toUpperCase().includes('NO CODE FOUND')) {
      return {
        success: false,
        code: null,
        error: 'Không tìm thấy code trong ảnh. Vui lòng upload ảnh chứa code.',
        warnings: ['Ảnh này không chứa code lập trình'],
        confidence: 'none',
      };
    }
    
    // Check if extracted text contains actual code
    if (!containsCode(cleanedCode)) {
      return {
        success: false,
        code: null,
        error: 'Không tìm thấy code trong ảnh. Vui lòng upload ảnh chứa code.',
        warnings: ['Ảnh này có thể không chứa code hoặc code không rõ ràng'],
        confidence: 'none',
      };
    }
    
    const warnings = detectWarnings(cleanedCode, language);
    const confidence = assessConfidence(cleanedCode, warnings);
    
    return {
      success: true,
      code: cleanedCode,
      error: null,
      warnings,
      confidence,
    };
    
  } catch (error) {
    logger.error('Gemini OCR error', error);
    return {
      success: false,
      code: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      warnings: [],
      confidence: 'none',
    };
  }
}
