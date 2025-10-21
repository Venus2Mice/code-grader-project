import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react"

export const getStatusIcon = (status: string) => {
  const normalizedStatus = status?.toLowerCase()
  
  switch (normalizedStatus) {
    case "accepted":
      return <CheckCircle2 className="h-5 w-5 text-green-500" />
    case "wrong_answer":
    case "wrong answer":
      return <XCircle className="h-5 w-5 text-red-500" />
    case "compile_error":
    case "compile error":
    case "runtime_error":
    case "runtime error":
      return <AlertCircle className="h-5 w-5 text-orange-500" />
    case "time_limit":
    case "time limit exceeded":
      return <Clock className="h-5 w-5 text-yellow-500" />
    case "pending":
    case "running":
      return <Clock className="h-5 w-5 text-blue-500" />
    default:
      return <Clock className="h-5 w-5 text-muted-foreground" />
  }
}

export const getStatusText = (status: string) => {
  if (!status) return "Unknown"
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}
