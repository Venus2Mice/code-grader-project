import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"

export const getStatusDisplay = (status: string | undefined) => {
  const normalizedStatus = status?.toLowerCase()
  
  switch (normalizedStatus) {
    case "accepted":
      return { 
        icon: CheckCircle, 
        color: "text-green-600 dark:text-green-400", 
        bg: "bg-green-100 dark:bg-green-950/30", 
        label: "Accepted" 
      }
    case "wrong_answer":
    case "wrong answer":
      return { 
        icon: XCircle, 
        color: "text-red-600 dark:text-red-400", 
        bg: "bg-red-100 dark:bg-red-950/30", 
        label: "Wrong Answer" 
      }
    case "compile_error":
    case "compile error":
      return { 
        icon: AlertCircle, 
        color: "text-orange-500 dark:text-orange-400", 
        bg: "bg-orange-500/10 dark:bg-orange-950/30", 
        label: "Compile Error" 
      }
    case "time_limit":
    case "time limit exceeded":
      return { 
        icon: Clock, 
        color: "text-yellow-500 dark:text-yellow-400", 
        bg: "bg-yellow-500/10 dark:bg-yellow-950/30", 
        label: "Time Limit" 
      }
    case "runtime_error":
    case "runtime error":
      return { 
        icon: XCircle, 
        color: "text-red-500 dark:text-red-400", 
        bg: "bg-red-100 dark:bg-red-950/30", 
        label: "Runtime Error" 
      }
    case "pending":
      return { 
        icon: Clock, 
        color: "text-blue-600 dark:text-blue-400", 
        bg: "bg-blue-100 dark:bg-blue-950/30", 
        label: "Pending" 
      }
    case "running":
      return { 
        icon: Clock, 
        color: "text-blue-600 dark:text-blue-400", 
        bg: "bg-blue-100 dark:bg-blue-950/30", 
        label: "Running" 
      }
    default:
      return { 
        icon: Clock, 
        color: "text-muted-foreground", 
        bg: "bg-muted", 
        label: status || "Pending" 
      }
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
