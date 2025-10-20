/**
 * Centralized API Client with Error Handling
 * Provides consistent error handling, retry logic, and toast notifications
 */

import { toast } from "@/hooks/use-toast"

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // ms

// Error types
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message)
    this.name = "APIError"
  }
}

export class NetworkError extends Error {
  constructor(message: string = "Network connection failed") {
    super(message)
    this.name = "NetworkError"
  }
}

// Request options
interface RequestOptions extends RequestInit {
  skipAuth?: boolean
  skipErrorToast?: boolean
  retries?: number
  timeout?: number
}

// Response wrapper
interface APIResponse<T = any> {
  data: T
  status: number
  message?: string
}

/**
 * Sleep utility for retry delay
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Get auth token from localStorage
 */
const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

/**
 * Show error toast with Vietnamese messages
 */
const showErrorToast = (error: Error | APIError) => {
  let title = "Lỗi"
  let description = error.message

  if (error instanceof APIError) {
    switch (error.status) {
      case 400:
        title = "Yêu cầu không hợp lệ"
        break
      case 401:
        title = "Chưa đăng nhập"
        description = "Vui lòng đăng nhập để tiếp tục"
        break
      case 403:
        title = "Không có quyền truy cập"
        description = "Bạn không có quyền thực hiện thao tác này"
        break
      case 404:
        title = "Không tìm thấy"
        description = "Tài nguyên không tồn tại"
        break
      case 429:
        title = "Quá nhiều yêu cầu"
        description = "Vui lòng thử lại sau ít phút"
        break
      case 500:
        title = "Lỗi máy chủ"
        description = "Đã xảy ra lỗi, vui lòng thử lại sau"
        break
      case 503:
        title = "Dịch vụ tạm ngưng"
        description = "Hệ thống đang bảo trì, vui lòng thử lại sau"
        break
    }
  } else if (error instanceof NetworkError) {
    title = "Lỗi kết nối"
    description = "Không thể kết nối đến máy chủ. Vui lòng kiểm tra internet"
  }

  toast({
    variant: "destructive",
    title,
    description,
  })
}

/**
 * Main API client function
 */
export async function apiClient<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<APIResponse<T>> {
  const {
    skipAuth = false,
    skipErrorToast = false,
    retries = MAX_RETRIES,
    timeout = 30000,
    ...fetchOptions
  } = options

  // Build headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  }

  // Add auth token if not skipped
  if (!skipAuth) {
    const token = getAuthToken()
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }
  }

  // Build full URL
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`

  // Retry logic
  let lastError: Error | APIError | NetworkError | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      // Make request
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Parse response
      let data: any
      const contentType = response.headers.get("content-type")

      if (contentType?.includes("application/json")) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      // Handle non-OK responses
      if (!response.ok) {
        const errorMessage = data?.message || data?.error || `HTTP ${response.status}`
        const apiError = new APIError(errorMessage, response.status, data)

        // Don't retry on client errors (4xx) except 429
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw apiError
        }

        lastError = apiError

        // Retry on server errors (5xx) or 429
        if (attempt < retries) {
          await sleep(RETRY_DELAY * (attempt + 1)) // Exponential backoff
          continue
        }

        throw apiError
      }

      // Success
      return {
        data: data?.data ?? data,
        status: response.status,
        message: data?.message,
      }
    } catch (error) {
      // Handle network errors
      if (error instanceof DOMException && error.name === "AbortError") {
        lastError = new NetworkError("Request timeout")
      } else if (error instanceof TypeError && error.message === "Failed to fetch") {
        lastError = new NetworkError()
      } else if (error instanceof APIError) {
        lastError = error
      } else {
        lastError = error as Error
      }

      // Don't retry on abort or APIError
      if (error instanceof APIError || error instanceof DOMException) {
        break
      }

      // Retry on network errors
      if (attempt < retries) {
        await sleep(RETRY_DELAY * (attempt + 1))
        continue
      }

      break
    }
  }

  // Show error toast if not skipped
  if (!skipErrorToast && lastError) {
    showErrorToast(lastError)
  }

  // Throw the last error
  throw lastError || new Error("Unknown error occurred")
}

/**
 * Convenience methods
 */
export const api = {
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: "GET" }),

  post: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: "DELETE" }),
}

/**
 * Usage examples:
 * 
 * // Simple GET request
 * const response = await api.get<User>('/api/users/me')
 * console.log(response.data)
 * 
 * // POST with data
 * const response = await api.post<LoginResponse>('/api/auth/login', {
 *   email: 'user@example.com',
 *   password: 'password123'
 * })
 * 
 * // Skip error toast for custom handling
 * try {
 *   const response = await api.get('/api/data', { skipErrorToast: true })
 * } catch (error) {
 *   // Handle error manually
 * }
 * 
 * // Custom retry count
 * const response = await api.post('/api/submit', data, { retries: 5 })
 */
