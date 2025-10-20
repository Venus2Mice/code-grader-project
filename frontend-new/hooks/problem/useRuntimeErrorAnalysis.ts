"use client"

import { useState, useCallback } from "react"

interface RuntimeErrorAnalysis {
  errorType: string
  suggestions: string
}

export function useRuntimeErrorAnalysis() {
  const analyzeRuntimeError = useCallback((errorMessage: string, exitCode?: string): RuntimeErrorAnalysis => {
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
      // Exit code 141 = 128 + 13 (SIGPIPE - Output Limit Exceeded)
      else if (codeNum === 141 || error.includes('sigpipe') || error.includes('output limit')) {
        errorType = "Output Limit Exceeded (Exit Code 141)"
        suggestions.push("🔍 Nguyên nhân:")
        suggestions.push("• Chương trình in ra quá nhiều dữ liệu (>1MB)")
        suggestions.push("• Vòng lặp vô hạn với cout: while(1) cout << ...")
        suggestions.push("• In output sai định dạng (quá nhiều dòng/ký tự)")
        suggestions.push("• Không đọc đúng input nên in sai output")
        suggestions.push("• Quên xóa các câu lệnh debug cout")
        suggestions.push("\n💡 Giải pháp:")
        suggestions.push("• Kiểm tra vòng lặp cout có điều kiện dừng")
        suggestions.push("• Đọc kỹ yêu cầu output format")
        suggestions.push("• Xóa tất cả cout debug không cần thiết")
        suggestions.push("• Kiểm tra điều kiện in output")
        suggestions.push("• Chỉ in output theo đúng yêu cầu đề bài")
        suggestions.push("\n⚠️ Giới hạn hệ thống:")
        suggestions.push("  Maximum output size: 1MB")
        suggestions.push("  Program bị kill ngay khi vượt giới hạn!")
        suggestions.push("\n📝 Ví dụ lỗi thường gặp:")
        suggestions.push("  while(1) cout << \"hi\";  // ❌ LỖI! In vô hạn")
        suggestions.push("  for(int i=0; i<n; i++) cout << i;  // ✅ ĐÚNG!")
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
        } else {
          suggestions.push("🔍 Chương trình kết thúc với mã lỗi")
          suggestions.push("• Kiểm tra logic điều kiện thoát")
          suggestions.push("• Đảm bảo main() return 0 khi thành công")
          suggestions.push("• Xem output để biết lỗi cụ thể")
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
  }, [])

  return { analyzeRuntimeError }
}
