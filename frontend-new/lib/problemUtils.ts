import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"

export const getStatusDisplay = (status: string | undefined) => {
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

export const formatVietnameseDate = (dateString: string) => {
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
