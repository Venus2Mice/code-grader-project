"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Play, History, CheckCircle, XCircle, Clock, AlertCircle, RotateCcw, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CodeEditor } from "@/components/code-editor"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { problemAPI, submissionAPI } from "@/services/api"
import { ImageToCodeUpload } from "@/components/image-to-code-upload"

export default function ProblemSolvePage() {
  const params = useParams()
  const router = useRouter()
  const problemId = params.id as string
  const [problem, setProblem] = useState<any>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Store classId from URL search params or localStorage as fallback
  const [classId, setClassId] = useState<string | null>(null)
  
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null)
  
  // Error modal state
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    title: "",
    message: ""
  })

  const [code, setCode] = useState(`#include <iostream>
#include <vector>
using namespace std;

int main() {
    // Write your solution here
    
    return 0;
}`)

  const [language, setLanguage] = useState("cpp")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)
  const [originalTemplate, setOriginalTemplate] = useState("")  // Store original template for reset
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)  // Reset confirmation modal
  const fileInputRef = useRef<HTMLInputElement>(null)  // Reference for file input
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)  // Upload modal state
  const [isDragging, setIsDragging] = useState(false)  // Drag and drop state
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)  // Track uploaded file name

  // Analyze C++ code to detect if it has main() function
  const analyzeCppCode = (code: string): { hasMain: boolean; hasFunctions: boolean; analysis: string } => {
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

  // Process file (used by both file input and drag-drop)
  const processFile = (file: File) => {
    const fileName = file.name.toLowerCase()
    const fileExtension = fileName.split('.').pop()

    // Only allow .cpp and .txt files
    if (fileExtension !== 'cpp' && fileExtension !== 'txt') {
      setErrorModal({
        isOpen: true,
        title: "Invalid File Type",
        message: "Only .cpp and .txt files are allowed for upload."
      })
      return
    }

    // Read file content
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      
      // Analyze C++ code structure if it's a .cpp file
      if (fileExtension === 'cpp') {
        const analysis = analyzeCppCode(content)
        
        // Show analysis result in a modal
        setErrorModal({
          isOpen: true,
          title: "📊 Code Analysis Result",
          message: `File: ${file.name}\n\n${analysis.analysis}\n\n` +
                   `${problem?.grading_mode === 'function' 
                     ? '📌 Current problem uses FUNCTION grading mode\n' +
                       (analysis.hasMain 
                         ? '⚠️ Your code has main() - it may not work correctly!' 
                         : '✅ Your code structure matches the grading mode')
                     : '📌 Current problem uses STDIO grading mode\n' +
                       (analysis.hasMain 
                         ? '✅ Your code has main() - good to go!' 
                         : '⚠️ Your code lacks main() - it will fail!')
                   }\n\nCode loaded into editor. You can review and edit before submitting.`
        })
      }
      
      setCode(content)
      setUploadedFileName(file.name)
      setIsUploadModalOpen(false)
      
      // Show success message
      console.log(`File ${file.name} loaded successfully`)
    }
    reader.onerror = () => {
      setErrorModal({
        isOpen: true,
        title: "File Read Error",
        message: "Failed to read the file. Please try again."
      })
    }
    reader.readAsText(file)

    // Reset file input for next upload
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Handle file upload from input
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    processFile(file)
  }

  // Handle drag and drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  // Validate file extension before submit
  const validateFileForSubmit = (): boolean => {
    // Check if code appears to be from a .cpp file based on content
    // We can't track original file extension after loading, so we validate based on language setting
    if (language !== 'cpp') {
      setErrorModal({
        isOpen: true,
        title: "Invalid Submission",
        message: "Only C++ (.cpp) files can be submitted. Please select C++ as the language."
      })
      return false
    }
    return true
  }

  // Helper function to analyze runtime errors and provide suggestions
  const analyzeRuntimeError = (errorMessage: string, exitCode?: string) => {
    const error = errorMessage.toLowerCase()
    const suggestions: string[] = []
    let errorType = "Runtime Error"
    
    // Extract exit code from error message if not provided
    const exitCodeMatch = error.match(/exit code:\s*(\d+)/)
    const code = exitCode || (exitCodeMatch ? exitCodeMatch[1] : null)
    
    // Analyze based on exit code (Linux signal codes)
    if (code) {
      const codeNum = parseInt(code)
      
      // Exit code 136 = 128 + 8 (SIGFPE - Floating Point Exception)
      if (codeNum === 136 || error.includes('floating point exception') || error.includes('sigfpe')) {
        errorType = "Floating Point Exception (Exit Code 136)"
        suggestions.push("🔍 Nguyên nhân:")
        suggestions.push("• Chia cho 0 (division by zero) - Nguyên nhân phổ biến nhất!")
        suggestions.push("• Phép chia nguyên với mẫu số = 0")
        suggestions.push("• Phép modulo với số 0: a % 0")
        suggestions.push("\n💡 Giải pháp:")
        suggestions.push("• Kiểm tra mẫu số trước khi chia:")
        suggestions.push("  if (b != 0) { result = a / b; }")
        suggestions.push("• Kiểm tra modulo: if (n != 0) { result = a % n; }")
        suggestions.push("• Debug: In ra giá trị mẫu số trước phép chia")
        suggestions.push("\n📝 Ví dụ:")
        suggestions.push("  int a = 10, b = 0;")
        suggestions.push("  int c = a / b;  // ❌ LỖI!")
        suggestions.push("  if (b != 0) c = a / b;  // ✅ ĐÚNG!")
      }
      // Exit code 139 = 128 + 11 (SIGSEGV - Segmentation Fault)
      else if (codeNum === 139 || error.includes('segmentation fault') || error.includes('sigsegv')) {
        errorType = "Segmentation Fault (Exit Code 139)"
        suggestions.push("🔍 Nguyên nhân phổ biến:")
        suggestions.push("• Truy cập mảng ngoài phạm vi: arr[100] khi mảng chỉ có 10 phần tử")
        suggestions.push("• Sử dụng con trỏ NULL: int* p = NULL; *p = 5;")
        suggestions.push("• Con trỏ chưa khởi tạo: int* p; *p = 5;")
        suggestions.push("• Truy cập bộ nhớ đã giải phóng (dangling pointer)")
        suggestions.push("• Stack overflow do đệ quy quá sâu")
        suggestions.push("\n💡 Giải pháp:")
        suggestions.push("• Kiểm tra chỉ số mảng: if (i >= 0 && i < n)")
        suggestions.push("• Khởi tạo con trỏ trước khi dùng")
        suggestions.push("• Dùng vector<int> thay vì int arr[]")
        suggestions.push("• Kiểm tra điều kiện dừng đệ quy")
        suggestions.push("\n📝 Ví dụ:")
        suggestions.push("  int arr[10];")
        suggestions.push("  arr[15] = 5;  // ❌ LỖI! Index ngoài phạm vi")
        suggestions.push("  if (i < 10) arr[i] = 5;  // ✅ ĐÚNG!")
      }
      // Exit code 134 = 128 + 6 (SIGABRT - Abort signal)
      else if (codeNum === 134 || error.includes('aborted') || error.includes('sigabrt')) {
        errorType = "Program Aborted (Exit Code 134)"
        suggestions.push("🔍 Nguyên nhân:")
        suggestions.push("• assert() thất bại - điều kiện kiểm tra không đúng")
        suggestions.push("• Lỗi heap corruption (ghi đè bộ nhớ heap)")
        suggestions.push("• Double-free: giải phóng cùng bộ nhớ 2 lần")
        suggestions.push("• Gọi abort() hoặc terminate() trong code")
        suggestions.push("\n💡 Giải pháp:")
        suggestions.push("• Kiểm tra điều kiện assert()")
        suggestions.push("• Tránh delete/free cùng con trỏ nhiều lần")
        suggestions.push("• Kiểm tra việc cấp phát và giải phóng bộ nhớ")
        suggestions.push("• Sử dụng smart pointer (unique_ptr, shared_ptr)")
      }
      // Exit code 137 = 128 + 9 (SIGKILL - Memory limit or killed)
      else if (codeNum === 137) {
        errorType = "Program Killed (Exit Code 137)"
        suggestions.push("🔍 Nguyên nhân:")
        suggestions.push("• Vượt giới hạn bộ nhớ (Memory Limit Exceeded)")
        suggestions.push("• Cấp phát quá nhiều bộ nhớ")
        suggestions.push("• Vòng lặp tạo quá nhiều object")
        suggestions.push("• Mảng/vector quá lớn")
        suggestions.push("\n💡 Giải pháp:")
        suggestions.push("• Giảm kích thước mảng/vector")
        suggestions.push("• Giải phóng bộ nhớ không dùng nữa")
        suggestions.push("• Tối ưu cách lưu trữ dữ liệu")
        suggestions.push("• Tránh copy object lớn không cần thiết")
      }
      // Exit code 124 = Timeout
      else if (codeNum === 124 || error.includes('timeout') || error.includes('time limit')) {
        errorType = "Time Limit Exceeded (Exit Code 124)"
        suggestions.push("🔍 Nguyên nhân:")
        suggestions.push("• Thuật toán chạy quá chậm (độ phức tạp cao)")
        suggestions.push("• Vòng lặp vô hạn: while(true) không có break")
        suggestions.push("• Đệ quy không có điều kiện dừng")
        suggestions.push("• Độ phức tạp O(n²) hoặc O(n³) với n lớn")
        suggestions.push("\n💡 Giải pháp:")
        suggestions.push("• Kiểm tra điều kiện dừng vòng lặp")
        suggestions.push("• Tối ưu thuật toán: O(n²) → O(n log n) → O(n)")
        suggestions.push("• Sử dụng map/set thay vì mảng khi tìm kiếm")
        suggestions.push("• Thêm điều kiện dừng cho đệ quy")
        suggestions.push("\n📝 Ví dụ độ phức tạp:")
        suggestions.push("  O(n²): 2 vòng for lồng nhau - chậm!")
        suggestions.push("  O(n log n): sort() - nhanh hơn")
        suggestions.push("  O(n): 1 vòng for - nhanh nhất!")
      }
      // Other exit codes
      else if (codeNum > 128) {
        const signal = codeNum - 128
        errorType = `Runtime Error (Exit Code ${codeNum} = Signal ${signal})`
        suggestions.push("🔍 Chương trình nhận signal và kết thúc bất thường")
        suggestions.push(`• Signal number: ${signal}`)
        suggestions.push("• Kiểm tra lỗi runtime trong code")
        suggestions.push("• Xem output để biết chi tiết lỗi")
        suggestions.push("\n💡 Các signal phổ biến:")
        suggestions.push("  Signal 6 (134): SIGABRT - Program aborted")
        suggestions.push("  Signal 8 (136): SIGFPE - Division by zero")
        suggestions.push("  Signal 9 (137): SIGKILL - Killed (memory limit)")
        suggestions.push("  Signal 11 (139): SIGSEGV - Segmentation fault")
      }
      else if (codeNum !== 0) {
        errorType = `Program Exited with Code ${codeNum}`
        
        // Specific exit codes (not signals)
        if (codeNum === 1) {
          errorType = "General Error (Exit Code 1)"
          suggestions.push("🔍 Nguyên nhân phổ biến:")
          suggestions.push("• Lỗi logic trong code: điều kiện sai, tính toán sai")
          suggestions.push("• Exception/error được throw nhưng không catch")
          suggestions.push("• Hàm return 1 hoặc exit(1) khi có lỗi")
          suggestions.push("• Lỗi runtime không xác định rõ")
          suggestions.push("• File I/O error (không mở được file)")
          suggestions.push("\n💡 Giải pháp:")
          suggestions.push("• Kiểm tra output để xem thông báo lỗi cụ thể")
          suggestions.push("• Kiểm tra các điều kiện if/else")
          suggestions.push("• Đảm bảo không có throw/exit trong code")
          suggestions.push("• Kiểm tra biến có giá trị hợp lệ không")
          suggestions.push("• Debug từng phần code để tìm vị trí lỗi")
          suggestions.push("\n📝 Ví dụ:")
          suggestions.push("  if (n < 0) return 1;  // ❌ Trả về lỗi")
          suggestions.push("  if (n < 0) return 0;  // ✅ Hoặc xử lý đúng")
        }
        else if (codeNum === 2) {
          errorType = "Misuse of Shell Command (Exit Code 2)"
          suggestions.push("🔍 Nguyên nhân:")
          suggestions.push("• Lỗi cú pháp hoặc sử dụng command sai")
          suggestions.push("• File không tồn tại hoặc không có quyền truy cập")
          suggestions.push("\n� Giải pháp:")
          suggestions.push("• Kiểm tra code không sử dụng system command")
          suggestions.push("• Xem output để biết chi tiết")
        }
        else {
          suggestions.push("�🔍 Chương trình kết thúc với mã lỗi")
          suggestions.push("• Kiểm tra logic điều kiện thoát")
          suggestions.push("• Đảm bảo main() return 0 khi thành công")
          suggestions.push("• Xem output để biết lỗi cụ thể")
          suggestions.push(`• Exit code ${codeNum} có thể do:`)
          suggestions.push("  - return ${codeNum} trong main()")
          suggestions.push("  - exit(${codeNum}) được gọi")
          suggestions.push("  - Lỗi hệ thống hoặc runtime")
        }
      }
    }
    // Fallback: analyze by error message if no exit code
    else if (error.includes('segmentation fault') || error.includes('sigsegv')) {
      errorType = "Segmentation Fault (SIGSEGV)"
      suggestions.push("🔍 Nguyên nhân: Truy cập bộ nhớ không hợp lệ")
      suggestions.push("• Truy cập mảng ngoài phạm vi")
      suggestions.push("• Sử dụng con trỏ NULL")
      suggestions.push("• Con trỏ chưa khởi tạo")
      suggestions.push("\n💡 Giải pháp:")
      suggestions.push("• Kiểm tra chỉ số mảng")
      suggestions.push("• Khởi tạo con trỏ trước khi dùng")
      suggestions.push("• Sử dụng vector thay vì mảng C")
    }
    else if (error.includes('timeout') || error.includes('time limit')) {
      errorType = "Time Limit Exceeded"
      suggestions.push("🔍 Nguyên nhân: Code chạy quá lâu")
      suggestions.push("• Vòng lặp vô hạn")
      suggestions.push("• Thuật toán không hiệu quả")
      suggestions.push("\n💡 Giải pháp:")
      suggestions.push("• Kiểm tra điều kiện dừng vòng lặp")
      suggestions.push("• Tối ưu thuật toán")
    }
    // General runtime errors
    else {
      suggestions.push("🔍 Các nguyên nhân có thể:")
      suggestions.push("• Lỗi logic trong code")
      suggestions.push("• Sử dụng biến chưa khởi tạo")
      suggestions.push("• Lỗi truy cập bộ nhớ")
      suggestions.push("• Exception không được xử lý")
      suggestions.push("\n💡 Gợi ý debug:")
      suggestions.push("• Thêm cout để debug từng bước")
      suggestions.push("• Kiểm tra input đặc biệt (edge cases)")
      suggestions.push("• Chạy với test case đơn giản trước")
    }
    
    return { errorType, suggestions: suggestions.join('\n') }
  }

  // Get classId from URL params or localStorage
  useEffect(() => {
    // Try to get from URL search params first
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const classIdFromUrl = urlParams.get('classId')
      
      if (classIdFromUrl) {
        setClassId(classIdFromUrl)
        // Save to localStorage for future use
        localStorage.setItem(`problem_${problemId}_classId`, classIdFromUrl)
      } else {
        // Fallback to localStorage
        const savedClassId = localStorage.getItem(`problem_${problemId}_classId`)
        if (savedClassId) {
          setClassId(savedClassId)
        }
      }
    }
  }, [problemId])

  useEffect(() => {
    fetchProblemData()
  }, [problemId])

  const fetchProblemData = async () => {
    try {
      setIsLoading(true)
      const response = await problemAPI.getById(Number(problemId))
      const problemData = response.data
      setProblem(problemData)
      
      // Store classId if available from API response
      if (problemData.class_id) {
        setClassId(String(problemData.class_id))
        localStorage.setItem(`problem_${problemId}_classId`, String(problemData.class_id))
      }
      
      // Load function template if problem is in function mode
      if (problemData.grading_mode === 'function' && problemData.function_signature) {
        // Detect language from function signature
        const signature = problemData.function_signature
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
        setOriginalTemplate(templateCode)  // Store template for reset
      }
      
      // Fetch user's submissions for this problem
      await refreshSubmissions()
    } catch (err) {
      console.error('Error fetching problem:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshSubmissions = async () => {
    try {
      console.log('[REFRESH] Fetching submissions for problem:', problemId)
      const subsResponse = await submissionAPI.getMySubmissions(Number(problemId))
      console.log('[REFRESH] Submissions received:', subsResponse.data)
      
      // Handle both old format (array) and new format (object with data + pagination)
      const submissionsArray = Array.isArray(subsResponse.data) 
        ? subsResponse.data 
        : (subsResponse.data.data || [])
      
      console.log('[REFRESH] Number of submissions:', submissionsArray.length)
      
      // Debug: log each submission
      submissionsArray.forEach((sub: any, index: number) => {
        console.log(`[REFRESH] Submission ${index + 1}:`, {
          id: sub.id,
          status: sub.status,
          score: sub.score,
          passedTests: sub.passedTests,
          totalTests: sub.totalTests,
          hasCode: !!sub.code,
          submittedAt: sub.submittedAt
        })
      })
      
      setSubmissions(submissionsArray)
    } catch (err) {
      console.error('Error fetching submissions:', err)
    }
  }

  const handleRun = async () => {
    setIsRunning(true)
    setTestResults(null)
    try {
      console.log('[RUN] Testing code - this will NOT be saved to history')
      const response = await submissionAPI.runCode({
        problem_id: Number(problemId),
        source_code: code,
        language: language
      })
      
      const submissionId = response.data.submission_id
      console.log('[RUN] Test submission ID:', submissionId)
      
      // Show running status
      setTestResults({
        status: "running",
        message: "Testing your code...",
        isTest: true
      })
      
      // Poll with exponential backoff: 1s → 2s → 4s → 8s (max 8s)
      let pollCount = 0
      let pollInterval: NodeJS.Timeout | null = null
      
      const scheduleNextPoll = () => {
        pollCount++
        const backoffMs = Math.min(1000 * Math.pow(2, pollCount - 1), 8000) // 1s, 2s, 4s, 8s...
        
        pollInterval = setTimeout(async () => {
          try {
            const resultResponse = await submissionAPI.getById(submissionId)
            const submissionData = resultResponse.data
            
            // Check if grading is complete
            if (submissionData.status !== 'Pending' && submissionData.status !== 'Running') {
              setIsRunning(false)
              
              console.log('[DEBUG] Submission completed:', submissionData)
              console.log('[DEBUG] Status:', submissionData.status)
              console.log('[DEBUG] Results:', submissionData.results)
              
              // Auto-show modal for any error (Compile Error, Runtime Error, Time Limit, Memory Limit)
              if (submissionData.results && submissionData.results.length > 0) {
                // Find first error with error_message
                const errorResult = submissionData.results.find((r: any) => r.error_message)
                
                if (errorResult && errorResult.error_message) {
                  console.log('[DEBUG] Error found:', errorResult)
                  const statusNorm = String(errorResult.status || submissionData.status || '').toLowerCase()
                  
                  // Determine error type and show appropriate modal
                  if (statusNorm.includes('compile')) {
                    // Compile Error
                    setErrorModal({
                      isOpen: true,
                      title: "Compilation Error",
                      message: errorResult.error_message
                    })
                  } else if (statusNorm.includes('runtime') || statusNorm.includes('time limit') || statusNorm.includes('memory limit')) {
                    // Runtime Error, Time Limit, Memory Limit - with analysis
                    const analysis = analyzeRuntimeError(errorResult.error_message)
                    setErrorModal({
                      isOpen: true,
                      title: `${analysis.errorType} - Test Case #${errorResult.test_case_id || 'N/A'}`,
                      message: `${errorResult.error_message}\n\n${'='.repeat(50)}\n\n${analysis.suggestions}`
                    })
                  } else {
                    // Other errors
                    setErrorModal({
                      isOpen: true,
                      title: `Error: ${errorResult.status || 'Unknown'}`,
                      message: errorResult.error_message
                    })
                  }
                }
              }
              
              // Compute passed/total/score locally from results to avoid backend inconsistencies
              const resultsArr = submissionData.results && Array.isArray(submissionData.results) ? submissionData.results : []
              const totalTestsComputed = resultsArr.filter((r: any) => r.test_case_id !== null && r.test_case_id !== undefined).length
              const passedTestsComputed = resultsArr.reduce((acc: number, r: any) => {
                const s = String(r.status || '').toLowerCase()
                if (['passed', 'accepted', 'ok', 'success'].includes(s)) return acc + 1
                return acc
              }, 0)

              // Compute score by points when problem test_cases available, otherwise by count
              let scoreComputed = 0
              try {
                const totalPoints = (problem && problem.test_cases && problem.test_cases.length > 0)
                  ? problem.test_cases.reduce((sum: number, tc: any) => sum + (tc.points || 0), 0)
                  : 0

                if (totalPoints > 0) {
                  const earnedPoints = resultsArr.reduce((sum: number, r: any) => {
                    const s = String(r.status || '').toLowerCase()
                    if (['passed', 'accepted', 'ok', 'success'].includes(s)) {
                      const tc = problem.test_cases.find((t: any) => t.id === r.test_case_id)
                      return sum + (tc ? (tc.points || 0) : 0)
                    }
                    return sum
                  }, 0)
                  scoreComputed = Math.round((earnedPoints / totalPoints) * 100)
                } else if (totalTestsComputed > 0) {
                  scoreComputed = Math.round((passedTestsComputed / totalTestsComputed) * 100)
                } else {
                  scoreComputed = submissionData.score || 0
                }
              } catch (e) {
                scoreComputed = submissionData.score || 0
              }

              const finalStatus = (passedTestsComputed > 0 && totalTestsComputed > 0 && passedTestsComputed === totalTestsComputed) ? 'accepted' : (submissionData.status === 'Compile Error' ? 'compile_error' : 'error')

              // Display results with computed values
              setTestResults({
                status: finalStatus,
                message: submissionData.status,
                isTest: true,
                score: scoreComputed,
                passedTests: passedTestsComputed,
                totalTests: totalTestsComputed,
                results: resultsArr
              })
              return // Exit polling
            }
            
            // Still pending - schedule next poll
            if (pollCount < 15) { // Max 15 polls = ~8 minutes with exponential backoff
              scheduleNextPoll()
            } else {
              setIsRunning(false)
              setTestResults({
                status: "error",
                message: "Test timeout - taking too long",
                isTest: true
              })
            }
          } catch (pollErr) {
            console.error('Error polling results:', pollErr)
            setIsRunning(false)
            setTestResults({
              status: "error",
              message: "Failed to get test results",
              isTest: true
            })
          }
        }, backoffMs)
      }
      
      // Start polling
      scheduleNextPoll()
      
    } catch (err: any) {
      console.error('Error running code:', err)
      setTestResults({
        status: "error",
        message: err.response?.data?.msg || 'Failed to run code',
        isTest: true
      })
      setIsRunning(false)
    }
  }

  const handleSubmit = async () => {
    // Validate that only .cpp files can be submitted
    if (!validateFileForSubmit()) {
      return
    }

    setIsSubmitting(true)
    setTestResults(null)
    try {
      console.log('[SUBMIT] Submitting code - this WILL be saved to history')
      const response = await submissionAPI.create({
        problem_id: Number(problemId),
        source_code: code,
        language: language
      })
      
      const submissionId = response.data.submission_id || response.data.id
      console.log('[SUBMIT] Submission created with ID:', submissionId)
      console.log('[SUBMIT] Response data:', response.data)
      
      // Immediately refresh submissions list to show pending submission
      console.log('[SUBMIT] Adding pending submission to list...')
      await refreshSubmissions()
      
      // Show pending status
      setTestResults({
        status: "pending",
        message: "Submission queued for grading...",
        isTest: false
      })
      
      // Poll with exponential backoff: 1s → 2s → 4s → 8s
      let pollCount = 0
      let pollInterval: NodeJS.Timeout | null = null
      
      const scheduleSubmitPoll = () => {
        pollCount++
        const backoffMs = Math.min(1000 * Math.pow(2, pollCount - 1), 8000)
        
        pollInterval = setTimeout(async () => {
          try {
            const resultResponse = await submissionAPI.getById(submissionId)
            const submissionData = resultResponse.data
            
            // Check if grading is complete
            if (submissionData.status !== 'Pending' && submissionData.status !== 'Running') {
              setIsSubmitting(false)
              
              console.log('[DEBUG] Submission completed:', submissionData)
              console.log('[DEBUG] Status:', submissionData.status)
              console.log('[DEBUG] Results:', submissionData.results)
              
              // Auto-show modal for any error (Compile Error, Runtime Error, Time Limit, Memory Limit)
              if (submissionData.results && submissionData.results.length > 0) {
                // Find first error with error_message
                const errorResult = submissionData.results.find((r: any) => r.error_message)
                
                if (errorResult && errorResult.error_message) {
                  console.log('[DEBUG] Error found:', errorResult)
                  const statusNorm = String(errorResult.status || submissionData.status || '').toLowerCase()
                  
                  // Determine error type and show appropriate modal
                  if (statusNorm.includes('compile')) {
                    // Compile Error
                    setErrorModal({
                      isOpen: true,
                      title: "Compilation Error",
                      message: errorResult.error_message
                    })
                  } else if (statusNorm.includes('runtime') || statusNorm.includes('time limit') || statusNorm.includes('memory limit')) {
                    // Runtime Error, Time Limit, Memory Limit - with analysis
                    const analysis = analyzeRuntimeError(errorResult.error_message)
                    setErrorModal({
                      isOpen: true,
                      title: `${analysis.errorType} - Test Case #${errorResult.test_case_id || 'N/A'}`,
                      message: `${errorResult.error_message}\n\n${'='.repeat(50)}\n\n${analysis.suggestions}`
                    })
                  } else {
                    // Other errors
                    setErrorModal({
                      isOpen: true,
                      title: `Error: ${errorResult.status || 'Unknown'}`,
                      message: errorResult.error_message
                    })
                  }
                }
              }

              // Compute results locally similar to run handler
              const resultsArr = submissionData.results && Array.isArray(submissionData.results) ? submissionData.results : []
              const totalTestsComputed = resultsArr.filter((r: any) => r.test_case_id !== null && r.test_case_id !== undefined).length
              const passedTestsComputed = resultsArr.reduce((acc: number, r: any) => {
                const s = String(r.status || '').toLowerCase()
                if (['passed', 'accepted', 'ok', 'success'].includes(s)) return acc + 1
                return acc
              }, 0)

              let scoreComputed = 0
              try {
                const totalPoints = (problem && problem.test_cases && problem.test_cases.length > 0)
                  ? problem.test_cases.reduce((sum: number, tc: any) => sum + (tc.points || 0), 0)
                  : 0

                if (totalPoints > 0) {
                  const earnedPoints = resultsArr.reduce((sum: number, r: any) => {
                    const s = String(r.status || '').toLowerCase()
                    if (['passed', 'accepted', 'ok', 'success'].includes(s)) {
                      const tc = problem.test_cases.find((t: any) => t.id === r.test_case_id)
                      return sum + (tc ? (tc.points || 0) : 0)
                    }
                    return sum
                  }, 0)
                  scoreComputed = Math.round((earnedPoints / totalPoints) * 100)
                } else if (totalTestsComputed > 0) {
                  scoreComputed = Math.round((passedTestsComputed / totalTestsComputed) * 100)
                } else {
                  scoreComputed = submissionData.score || 0
                }
              } catch (e) {
                scoreComputed = submissionData.score || 0
              }

              const finalStatus = (passedTestsComputed > 0 && totalTestsComputed > 0 && passedTestsComputed === totalTestsComputed) ? 'accepted' : (submissionData.status === 'Compile Error' ? 'compile_error' : 'error')

              setTestResults({
                status: finalStatus,
                message: submissionData.status,
                isTest: false,
                score: scoreComputed,
                passedTests: passedTestsComputed,
                totalTests: totalTestsComputed,
                results: resultsArr
              })
              
              // Refresh submissions list immediately after completion
              console.log('[SUBMIT] Submission completed. Refreshing submissions list...')
              refreshSubmissions().then(() => {
                console.log('[SUBMIT] Submissions refreshed successfully')
              }).catch(err => {
                console.error('[SUBMIT] Failed to refresh submissions:', err)
              })
              return // Exit polling
            }
            
            // Still pending - schedule next poll
            if (pollCount < 15) {
              scheduleSubmitPoll()
            } else {
              setIsSubmitting(false)
              setTestResults({
                status: "error",
                message: "Grading timeout - please check submission history",
                isTest: false
              })
            }
          } catch (pollErr) {
            console.error('Error polling submission results:', pollErr)
            setIsSubmitting(false)
            setTestResults({
              status: "error",
              message: "Failed to get submission results",
              isTest: false
            })
          }
        }, backoffMs)
      }
      
      // Start polling
      scheduleSubmitPoll()
      
    } catch (err: any) {
      console.error('Error submitting code:', err)
      setTestResults({
        status: "error",
        message: err.response?.data?.msg || 'Failed to submit code',
        isTest: false
      })
      setIsSubmitting(false)
    }
  }

  const getStatusDisplay = (status: string | undefined) => {
    const normalizedStatus = status?.toLowerCase()
    
    switch (normalizedStatus) {
      case "accepted":
        return { icon: CheckCircle, color: "text-green-600", bg: "bg-green-100", label: "Accepted" }
      case "wrong_answer":
      case "wrong answer":
        return { icon: XCircle, color: "text-red-600", bg: "bg-red-100", label: "Wrong Answer" }
      case "compile_error":
      case "compile error":
        return { icon: AlertCircle, color: "text-orange-500", bg: "bg-orange-500/10", label: "Compile Error" }
      case "time_limit":
      case "time limit exceeded":
        return { icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10", label: "Time Limit" }
      case "runtime_error":
      case "runtime error":
        return { icon: XCircle, color: "text-red-500", bg: "bg-red-100", label: "Runtime Error" }
      case "pending":
        return { icon: Clock, color: "text-blue-600", bg: "bg-blue-100", label: "Pending" }
      case "running":
        return { icon: Clock, color: "text-blue-600", bg: "bg-blue-100", label: "Running" }
      default:
        return { icon: Clock, color: "text-muted-foreground", bg: "bg-muted", label: status || "Pending" }
    }
  }

  const viewSubmission = async (submission: any) => {
    setSelectedSubmission(submission)
    console.log('[VIEW] Loading submission:', submission)
    
    // If code is already in submission object, use it directly
    if (submission.code) {
      console.log('[VIEW] Using code from submission object')
      setCode(submission.code)
      setLanguage(submission.language || 'cpp')
      setIsHistoryOpen(false)
      return
    }
    
    // Otherwise fetch the code for this submission
    try {
      console.log('[VIEW] Fetching code from API for submission:', submission.id)
      const codeResponse = await submissionAPI.getCode(submission.id)
      console.log('[VIEW] Code response:', codeResponse.data)
      // Backend returns "code", not "source_code"
      setCode(codeResponse.data.code || codeResponse.data.source_code || '')
      setLanguage(codeResponse.data.language || submission.language || 'cpp')
    } catch (err) {
      console.error('Error fetching submission code:', err)
    }
    setIsHistoryOpen(false)
  }

  // Reset code to original template
  const handleResetCode = () => {
    setCode(originalTemplate)
    setTestResults(null)
    setIsResetModalOpen(false)
  }

  // Format date to Vietnam timezone
  const formatVietnameseDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
    } catch (err) {
      return 'N/A'
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-brutal-bg">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
      </div>
    )
  }

  if (!problem) {
    return <div>Problem not found</div>
  }

  return (
    <div className="flex h-screen flex-col bg-brutal-bg">
      {/* Header */}
      <div className="border-b-4 border-black bg-background">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-4 md:px-6 py-4">
          <div className="flex items-center gap-2 md:gap-4 flex-wrap">
            {classId ? (
              <Link
                href={`/student/class/${classId}`}
                className="inline-flex items-center gap-2 border-4 border-border bg-muted px-3 md:px-4 py-2 text-xs md:text-sm font-black uppercase text-foreground transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
              >
                <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">BACK</span>
              </Link>
            ) : (
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 border-4 border-border bg-muted px-3 md:px-4 py-2 text-xs md:text-sm font-black uppercase text-foreground transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
              >
                <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">BACK</span>
              </Button>
            )}
            <div className="hidden md:block h-8 w-1 bg-foreground" />
            <h1 className="text-sm md:text-lg font-black uppercase text-foreground line-clamp-1">{problem.title}</h1>
            <span
              className={`border-4 border-black px-2 md:px-3 py-1 text-xs font-black uppercase ${
                problem.difficulty === "easy"
                  ? "bg-green-400"
                  : problem.difficulty === "medium"
                    ? "bg-yellow-400"
                    : "bg-red-400"
              }`}
            >
              {problem.difficulty}
            </span>
          </div>

          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            <Select value={language} onValueChange={setLanguage} disabled>
              <SelectTrigger className="w-24 md:w-32 font-black uppercase text-xs md:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cpp">C++</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="java">Java</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
              </SelectContent>
            </Select>
            {problem.grading_mode === 'function' && originalTemplate && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 font-black uppercase bg-transparent text-xs md:text-sm hover:bg-blue-100 hover:text-blue-700 hover:border-blue-700"
                onClick={() => setIsResetModalOpen(true)}
                title="Reset code to original template"
              >
                <RotateCcw className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">RESET</span>
              </Button>
            )}

            {/* File Upload Button */}
            <Button
              variant="outline"
              size="sm"
              className="gap-2 font-black uppercase bg-transparent text-xs md:text-sm hover:bg-purple-100 hover:text-purple-700 hover:border-purple-700"
              onClick={() => setIsUploadModalOpen(true)}
              disabled={isRunning || isSubmitting}
              title="Upload .cpp or .txt file"
            >
              <Upload className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">UPLOAD</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-2 font-black uppercase bg-transparent text-xs md:text-sm"
              onClick={() => setIsHistoryOpen(true)}
            >
              <History className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">HISTORY ({submissions.length})</span>
              <span className="sm:hidden">({submissions.length})</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleRun}
              disabled={isRunning || isSubmitting}
              className="gap-2 font-black uppercase text-xs md:text-sm bg-brutal-yellow hover:bg-amber-500 hover:text-black border-black"
            >
              <Play className="h-4 w-4 md:h-5 md:w-5" />
              {isRunning ? "RUNNING..." : "RUN"}
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || isRunning}
              className="gap-2 font-black uppercase text-xs md:text-sm"
            >
              <CheckCircle className="h-4 w-4 md:h-5 md:w-5" />
              {isSubmitting ? "SUBMITTING..." : "SUBMIT"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Left Panel - Problem Description */}
        <div className="lg:w-1/2 overflow-y-auto border-b-4 lg:border-b-0 lg:border-r-4 border-black bg-background max-h-[40vh] lg:max-h-none">
          <div className="p-4 md:p-6">
            <Tabs defaultValue="description">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="description" className="font-black uppercase text-xs md:text-sm">
                  DESC
                </TabsTrigger>
                <TabsTrigger value="submissions" className="font-black uppercase text-xs md:text-sm">
                  SUBS
                </TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="mt-4 md:mt-6 space-y-4 md:space-y-6">
                <div>
                  <h2 className="mb-3 text-xl font-black uppercase text-foreground">PROBLEM</h2>
                  <div className="prose max-w-none">
                    <p className="font-bold text-foreground leading-relaxed">{problem.description}</p>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-lg font-black uppercase text-foreground">CONSTRAINTS</h3>
                  <ul className="space-y-2 text-sm font-bold text-foreground">
                    <li>TIME LIMIT: {problem.time_limit}MS</li>
                    <li>MEMORY LIMIT: {Math.round(problem.memory_limit / 1024)}MB</li>
                    <li>GRADING MODE: {problem.grading_mode?.toUpperCase() || 'STDIO'}</li>
                  </ul>
                </div>

                {problem.grading_mode === 'function' && problem.function_signature && (
                  <div>
                    <h3 className="mb-3 text-lg font-black uppercase text-foreground">FUNCTION SIGNATURE</h3>
                    <div className="border-4 border-black bg-brutal-accent p-3">
                      <pre className="font-mono text-sm text-black overflow-x-auto">
                        <code>{problem.function_signature}</code>
                      </pre>
                    </div>
                    <p className="mt-2 text-xs font-bold text-muted-foreground">
                      💡 This function template has been loaded into your code editor
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="mb-3 text-lg font-black uppercase text-foreground">TEST CASES</h3>
                  <div className="space-y-4">
                    {problem.test_cases && problem.test_cases.length > 0 ? (
                      problem.test_cases
                        .filter((tc: any) => !tc.is_hidden) // Only show non-hidden test cases
                        .map((testCase: any, index: number) => (
                          <Card 
                            key={testCase.id} 
                            className={`border-4 border-black p-4 ${
                              index % 3 === 0 ? "bg-brutal-yellow/30" : 
                              index % 3 === 1 ? "bg-brutal-pink/30" : 
                              "bg-brutal-blue/30"
                            }`}
                          >
                            <div className="mb-2 text-sm font-black uppercase text-foreground">
                              TEST CASE {index + 1}
                              {testCase.points > 0 && (
                                <span className="ml-2 text-xs bg-black text-white px-2 py-1 rounded">
                                  {testCase.points} PTS
                                </span>
                              )}
                            </div>
                            <div className="space-y-2">
                              <div>
                                <div className="mb-1 text-xs font-black uppercase text-foreground">INPUT:</div>
                                <pre className="border-4 border-black bg-background p-2 text-xs font-mono text-foreground">
                                  <code>{testCase.input || "(empty)"}</code>
                                </pre>
                              </div>
                              <div>
                                <div className="mb-1 text-xs font-black uppercase text-foreground">EXPECTED OUTPUT:</div>
                                <pre className="border-4 border-black bg-background p-2 text-xs font-mono text-foreground">
                                  <code>{testCase.expected_output || "(empty)"}</code>
                                </pre>
                              </div>
                            </div>
                          </Card>
                        ))
                    ) : (
                      <div className="text-center py-8 border-4 border-dashed border-black bg-background">
                        <AlertCircle className="mx-auto mb-3 h-16 w-16 text-foreground" />
                        <p className="font-black uppercase text-foreground">NO TEST CASES AVAILABLE</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="submissions" className="mt-4 md:mt-6 space-y-4">
                {submissions.length > 0 ? (
                  submissions.map((submission) => {
                    const statusDisplay = getStatusDisplay(submission.status)
                    const StatusIcon = statusDisplay.icon

                    return (
                      <Card key={submission.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div
                                className={`flex items-center gap-1 ${statusDisplay.color} font-black uppercase text-sm`}
                              >
                                <StatusIcon className="h-5 w-5" />
                                <span>{statusDisplay.label}</span>
                              </div>
                              <span className="text-sm font-bold">SCORE: {submission.score || 0}/100</span>
                              <span className="text-sm font-bold">
                                {submission.passedTests || 0}/{submission.totalTests || 0} TESTS
                              </span>
                            </div>
                            <div className="text-xs font-bold text-muted-foreground">
                              {formatVietnameseDate(submission.submittedAt)}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewSubmission(submission)}
                            className="font-black uppercase"
                          >
                            VIEW
                          </Button>
                        </div>
                      </Card>
                    )
                  })
                ) : (
                  <div className="text-center py-8 border-4 border-dashed border-black bg-background">
                    <History className="mx-auto mb-3 h-16 w-16 text-foreground" />
                    <p className="font-black uppercase text-foreground">NO SUBMISSIONS</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right Panel - Code Editor */}
        <div className="flex lg:w-1/2 flex-col bg-background flex-1">
          <div className="flex-1 overflow-hidden border-4 border-black m-2 md:m-4">
            <CodeEditor value={code} onChange={setCode} language={language} />
          </div>

          {testResults && (
            <div className="border-t-4 border-black bg-background p-2 md:p-4 max-h-48 md:max-h-64 overflow-y-auto">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-black uppercase text-foreground">
                  {testResults.isTest ? "TEST RESULTS" : "SUBMISSION RESULTS"}
                </h3>
                <div
                  className={`flex items-center gap-2 font-black uppercase text-foreground ${
                    testResults.status === "accepted" 
                      ? "text-green-600" 
                      : testResults.status === "running" || testResults.status === "pending"
                        ? "text-blue-600"
                        : testResults.status === "info"
                          ? "text-yellow-600"
                          : "text-red-600"
                  }`}
                >
                  {testResults.status === "accepted" ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : testResults.status === "running" || testResults.status === "pending" ? (
                    <Clock className="h-6 w-6 animate-spin" />
                  ) : testResults.status === "info" ? (
                    <AlertCircle className="h-6 w-6" />
                  ) : (
                    <XCircle className="h-6 w-6" />
                  )}
                  <span>
                    {testResults.passedTests !== undefined && testResults.totalTests !== undefined
                      ? `${testResults.passedTests}/${testResults.totalTests} PASSED - ${testResults.score || 0}/100`
                      : testResults.message || testResults.status.toUpperCase()
                    }
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {testResults.results && Array.isArray(testResults.results) && testResults.results.length > 0 ? (
                  testResults.results
                    // Filter: Only show visible test cases (not hidden) for students
                    .filter((result: any) => {
                      // Always show compile errors (no test_case_id)
                      if (result.test_case_id === null || result.test_case_id === undefined) return true
                      // Only show test cases that are not hidden
                      return result.is_hidden === false
                    })
                    .map((result: any, index: number) => {
                    // Normalize status for robust checks
                    const rawStatus = String(result.status || '')
                    const statusNorm = rawStatus.toLowerCase()
                    const isPassed = ['passed', 'accepted', 'ok', 'success'].includes(statusNorm)
                    const isCompileError = statusNorm.includes('compile') || result.test_case_id === null || result.test_case_id === undefined

                    const cardClass = isPassed
                      ? 'border-green-600 bg-green-100'
                      : isCompileError
                        ? 'border-orange-600 bg-orange-100'
                        : 'border-red-600 bg-red-100'

                    const labelClass = isPassed ? 'text-green-600' : (isCompileError ? 'text-orange-600' : 'text-red-600')

                    return (
                      <Card
                        key={result.test_case_id ?? `error-${index}`}
                        className={`border-4 p-3 ${cardClass}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {isCompileError ? (
                              <>
                                <AlertCircle className="h-5 w-5 text-orange-600" />
                                <span className="text-sm font-black uppercase text-foreground">COMPILATION ERROR</span>
                              </>
                            ) : (
                              <>
                                <span className="text-sm font-black uppercase text-foreground">
                                  TEST CASE #{result.test_case_id}
                                </span>
                                <span className={`text-xs font-black uppercase text-foreground ${labelClass}`}>
                                  {isPassed ? 'ACCEPTED' : rawStatus}
                                </span>
                              </>
                            )}
                          </div>
                          {isPassed && (
                            <div className="text-xs font-bold text-muted-foreground">
                              {result.execution_time_ms}MS | {Math.round((result.memory_used_kb || 0) / 1024)}MB
                            </div>
                          )}
                        </div>

                        {/* Show output details for both passed and failed tests (not compile errors) */}
                        {!isCompileError && (
                          <div className="mt-2 space-y-2 text-xs">
                            {result.output_received && result.output_received.trim() !== '' && (
                              <div>
                                <div className="font-black uppercase mb-1 text-foreground">YOUR OUTPUT:</div>
                                <pre className={`bg-background border-2 p-2 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto ${
                                  isPassed ? 'border-green-600 text-green-600' : 'border-red-600 text-red-600'
                                }`}>
                                  {result.output_received}
                                </pre>
                              </div>
                            )}
                            {result.expected_output && (
                              <div>
                                <div className="font-black uppercase mb-1 text-foreground">EXPECTED OUTPUT:</div>
                                <pre className="bg-background border-2 border-green-600 p-2 text-green-600 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                                  {result.expected_output}
                                </pre>
                              </div>
                            )}
                            {!isPassed && result.error_message && (
                              <div>
                                <div className="font-black uppercase mb-1 text-foreground">ERROR:</div>
                                <pre className="bg-background border-2 border-red-600 p-2 text-red-600 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                                  {result.error_message}
                                </pre>
                                {/* Add View Details button for runtime errors */}
                                {statusNorm.includes('runtime') && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-2 gap-2 font-black uppercase text-xs"
                                    onClick={() => {
                                      const analysis = analyzeRuntimeError(result.error_message)
                                      setErrorModal({
                                        isOpen: true,
                                        title: `${analysis.errorType} - Test Case #${result.test_case_id}`,
                                        message: `${result.error_message}\n\n${'='.repeat(50)}\n\n${analysis.suggestions}`
                                      })
                                    }}
                                  >
                                    <AlertCircle className="h-4 w-4" />
                                    VIEW DETAILS & SUGGESTIONS
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Compile error section */}
                        {isCompileError && result.error_message && (
                          <div className="mt-2 space-y-2 text-xs">
                            <div>
                              <div className="font-black uppercase mb-1 text-foreground">ERROR:</div>
                              <pre className="bg-background border-2 border-red-600 p-2 text-red-600 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                                {result.error_message}
                              </pre>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2 gap-2 font-black uppercase text-xs"
                                onClick={() => setErrorModal({
                                  isOpen: true,
                                  title: "Compilation Error Details",
                                  message: result.error_message
                                })}
                              >
                                <AlertCircle className="h-4 w-4" />
                                VIEW FULL ERROR
                              </Button>
                            </div>
                          </div>
                        )}
                      </Card>
                    )
                  })
                ) : testResults.status === "running" || testResults.status === "pending" ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    <Clock className="mx-auto mb-2 h-8 w-8 animate-spin text-blue-600" />
                    <p className="font-bold">{testResults.message}</p>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No test results available</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submission History</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {submissions.map((submission) => {
              const statusDisplay = getStatusDisplay(submission.status)
              const StatusIcon = statusDisplay.icon

              return (
                <Card key={submission.id} className="border-border bg-card p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`flex items-center gap-1 ${statusDisplay.color}`}>
                          <StatusIcon className="h-4 w-4" />
                          <span className="font-semibold text-sm text-foreground">{statusDisplay.label}</span>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${statusDisplay.bg} ${statusDisplay.color}`}
                        >
                          {submission.language?.toUpperCase() || 'CPP'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-1">
                        <span>Score: {submission.score || 0}/100</span>
                        <span>
                          {submission.passedTests || 0}/{submission.totalTests || 0} tests passed
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatVietnameseDate(submission.submittedAt)}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => viewSubmission(submission)}>
                      Load Code
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Modal */}
      <Dialog open={isResetModalOpen} onOpenChange={setIsResetModalOpen}>
        <DialogContent className="max-w-md border-4 border-black">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase text-foreground">
              <RotateCcw className="h-6 w-6 text-blue-600" />
              RESET CODE?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-yellow-50 border-4 border-yellow-400 p-4">
              <p className="text-sm font-bold text-yellow-900 mb-2">
                ⚠️ Cảnh báo:
              </p>
              <p className="text-sm text-yellow-800">
                Bạn có chắc chắn muốn reset code về template ban đầu?
              </p>
              <p className="text-sm text-yellow-800 font-bold mt-2">
                Toàn bộ code hiện tại của bạn sẽ bị xóa!
              </p>
            </div>
            
            <div className="bg-blue-50 border-4 border-blue-400 p-4">
              <p className="text-sm font-bold text-blue-900 mb-2">💡 Lưu ý:</p>
              <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                <li>Code template sẽ được khôi phục với function signature ban đầu</li>
                <li>Bạn có thể xem lại code cũ trong phần HISTORY</li>
                <li>Hành động này không thể hoàn tác</li>
              </ul>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline"
              onClick={() => setIsResetModalOpen(false)}
              className="font-black uppercase border-2 border-black"
            >
              HỦY BỎ
            </Button>
            <Button 
              onClick={handleResetCode}
              className="font-black uppercase bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              XÁC NHẬN RESET
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload File Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="max-w-2xl border-4 border-black max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-black uppercase text-purple-600">
              <Upload className="h-6 w-6" />
              Upload Code
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="file" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file" className="font-black uppercase">
                📁 File Upload
              </TabsTrigger>
              <TabsTrigger value="image" className="font-black uppercase">
                📷 Image Upload
              </TabsTrigger>
            </TabsList>

            {/* File Upload Tab */}
            <TabsContent value="file" className="space-y-4 mt-4">
              {/* Info Section */}
              <div className="bg-blue-50 border-4 border-blue-600 p-4">
                <p className="font-black uppercase text-blue-900 mb-2 text-sm">
                  📁 Accepted File Types:
                </p>
                <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                  <li><code className="bg-blue-200 px-2 py-0.5 rounded font-bold">.cpp</code> - C++ source files (for submission)</li>
                  <li><code className="bg-blue-200 px-2 py-0.5 rounded font-bold">.txt</code> - Text files (for editing only)</li>
                </ul>
              </div>

              {/* Warning for submission */}
              <div className="bg-yellow-50 border-4 border-yellow-400 p-3">
                <p className="text-sm font-black text-yellow-900 uppercase">
                  ⚠️ Important:
                </p>
                <p className="text-sm text-yellow-800 mt-1">
                  Only <span className="font-bold">.cpp files</span> can be submitted for grading. 
                  .txt files are for viewing and editing purposes only.
                </p>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-4 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-purple-50'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".cpp,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragging ? 'text-purple-600' : 'text-gray-400'}`} />
                
                <p className="font-black uppercase text-lg mb-2">
                  {isDragging ? 'Drop file here!' : 'Drag & Drop your file here'}
                </p>
                
                <p className="text-sm text-muted-foreground mb-4">
                  or
                </p>
                
                <Button
                  type="button"
                  variant="outline"
                  className="font-black uppercase border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation()
                    fileInputRef.current?.click()
                  }}
                >
                  Browse Files
                </Button>
              </div>

              {/* Show uploaded file name if any */}
              {uploadedFileName && (
                <div className="bg-green-50 border-4 border-green-600 p-3 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="text-sm font-bold text-green-900">
                    Last uploaded: <code className="bg-green-200 px-2 py-0.5 rounded">{uploadedFileName}</code>
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Image Upload Tab */}
            <TabsContent value="image" className="mt-4">
              <ImageToCodeUpload
                language={language}
                onCodeExtracted={(extractedCode) => {
                  setCode(extractedCode)
                  setUploadedFileName('image-extracted-code')
                }}
              />
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUploadModalOpen(false)}
              className="font-black uppercase border-2 border-black"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Modal (Compile Error / Runtime Error / Code Analysis) */}
      <Dialog open={errorModal.isOpen} onOpenChange={(open) => setErrorModal({ ...errorModal, isOpen: open })}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto border-4 border-black">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 font-black uppercase ${
              errorModal.title.includes('Analysis') ? 'text-blue-600' : 'text-red-600'
            }`}>
              {errorModal.title.includes('Analysis') ? (
                <CheckCircle className="h-6 w-6" />
              ) : (
                <AlertCircle className="h-6 w-6" />
              )}
              {errorModal.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {errorModal.title.includes('Analysis') ? (
              // Code Analysis Result
              <div className="space-y-4">
                {errorModal.message.split('\n\n').map((section, idx) => {
                  if (section.includes('File:')) {
                    return (
                      <div key={idx} className="bg-purple-50 border-4 border-purple-600 p-4">
                        <p className="text-sm font-black text-purple-900">
                          {section}
                        </p>
                      </div>
                    )
                  } else if (section.includes('✅ Complete program') || section.includes('✅ Your code')) {
                    return (
                      <div key={idx} className="bg-green-50 border-4 border-green-600 p-4">
                        <pre className="text-sm font-bold text-green-900 whitespace-pre-wrap">
                          {section}
                        </pre>
                      </div>
                    )
                  } else if (section.includes('⚠️')) {
                    return (
                      <div key={idx} className="bg-yellow-50 border-4 border-yellow-400 p-4">
                        <pre className="text-sm font-bold text-yellow-900 whitespace-pre-wrap">
                          {section}
                        </pre>
                      </div>
                    )
                  } else if (section.includes('❌')) {
                    return (
                      <div key={idx} className="bg-red-50 border-4 border-red-600 p-4">
                        <pre className="text-sm font-bold text-red-900 whitespace-pre-wrap">
                          {section}
                        </pre>
                      </div>
                    )
                  } else if (section.includes('📌 Current problem')) {
                    return (
                      <div key={idx} className="bg-blue-50 border-4 border-blue-600 p-4">
                        <pre className="text-sm font-bold text-blue-900 whitespace-pre-wrap">
                          {section}
                        </pre>
                      </div>
                    )
                  } else {
                    return (
                      <div key={idx} className="bg-gray-50 border-2 border-gray-300 p-3">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">
                          {section}
                        </p>
                      </div>
                    )
                  }
                })}
              </div>
            ) : errorModal.message.includes('='.repeat(50)) ? (
              // Runtime Error with suggestions
              <>
                <div className="bg-red-50 border-4 border-red-600 p-4">
                  <p className="text-sm font-black text-red-900 mb-2 uppercase">
                    ❌ Chi tiết lỗi:
                  </p>
                  <pre className="bg-background border-2 border-red-400 p-3 rounded text-sm font-mono text-red-700 whitespace-pre-wrap overflow-x-auto">
{errorModal.message.split('='.repeat(50))[0].trim()}
                  </pre>
                </div>
                
                <div className="bg-blue-50 border-4 border-blue-600 p-4">
                  <p className="text-sm font-black text-blue-900 mb-3 uppercase">
                    💡 Hướng dẫn & Gợi ý:
                  </p>
                  <pre className="text-sm text-blue-800 whitespace-pre-wrap leading-relaxed">
{errorModal.message.split('='.repeat(50))[1]?.trim() || ''}
                  </pre>
                </div>
                
                <div className="bg-yellow-50 border-4 border-yellow-400 p-4">
                  <p className="text-sm font-black text-yellow-900 mb-2 uppercase">
                    ⚡ Debug Tips:
                  </p>
                  <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
                    <li>Chạy thử với test case đơn giản để xác định vấn đề</li>
                    <li>Thêm <code className="bg-yellow-200 px-1 py-0.5 rounded">cout</code> để kiểm tra giá trị biến</li>
                    <li>Kiểm tra các trường hợp biên (edge cases)</li>
                    <li>Đảm bảo khởi tạo tất cả biến trước khi sử dụng</li>
                  </ul>
                </div>
              </>
            ) : (
              // Compile Error (original format)
              <div className="bg-red-50 border-4 border-red-600 p-4 rounded">
                <p className="text-sm font-bold text-red-900 mb-3">
                  Your code has compilation errors. Please fix them before submitting:
                </p>
                <pre className="bg-background border-2 border-red-400 p-4 rounded text-sm font-mono text-red-700 whitespace-pre-wrap overflow-x-auto">
{errorModal.message}
                </pre>
              </div>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button 
              onClick={() => setErrorModal({ ...errorModal, isOpen: false })}
              className="font-black uppercase border-2 border-black"
            >
              ✓ GOT IT
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
