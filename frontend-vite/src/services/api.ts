import axios from 'axios'
import type { AxiosInstance, AxiosError } from 'axios'
import { logger } from '@/lib/logger'

// Base API URL - use /api proxy in Docker, localhost in dev
// In Docker: Nginx will proxy /api requests to backend:5000
// In dev (npm run dev): Vite dev server proxies to VITE_API_URL
const getApiUrl = () => {
  // Check if running in browser and if it's localhost
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    if (isLocalhost) {
      // Development: use env var or localhost:5000
      return import.meta.env.VITE_API_URL || 'http://localhost:5000'
    } else {
      // Production in Docker: use /api proxy (Nginx proxies to backend)
      return '/api'
    }
  }
  // SSR fallback
  return '/api'
}

const API_BASE_URL = getApiUrl()

// Debug log - chỉ trong development
logger.info('API initialized', {
  baseURL: API_BASE_URL,
  hasEnvVar: !!import.meta.env.VITE_API_URL,
  isProduction: typeof window !== 'undefined' && window.location.hostname !== 'localhost'
})

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
})

// Request interceptor - Add JWT token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // ✅ FIX: Không redirect khi đang ở auth pages để giữ console logs
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
      const isAuthPage = currentPath === '/login' || currentPath === '/register' || currentPath === '/'
      
      if (!isAuthPage) {
        // Token expired or invalid - redirect to login (only for protected pages)
        logger.warn('Token expired or invalid, redirecting to login')
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        
        // Dispatch event để các component khác biết
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('logout'))
          window.location.href = '/login'
        }
      } else {
        // ✅ Nếu đang ở auth page, log error chi tiết nhưng KHÔNG redirect
        logger.error('Authentication failed', error, {
          status: error.response?.status,
          url: error.config?.url,
          method: error.config?.method
        })
      }
    }
    
    // Log other errors for debugging
    if (error.response?.status && error.response.status !== 401) {
      logger.error(`API Error [${error.response.status}]`, error, {
        url: error.config?.url,
        method: error.config?.method,
      })
    }
    
    return Promise.reject(error)
  }
)

// ==================== AUTH APIs ====================

export const authAPI = {
  register: async (data: {
    full_name: string
    email: string
    password: string
    role: 'student' | 'teacher'
  }) => {
    return api.post('/api/auth/register', data)
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/api/auth/login', data)
    
    // ✅ Backend trả về: { status: 'success', data: { access_token, user } }
    const token = response.data.data?.access_token || response.data.access_token
    const user = response.data.data?.user || response.data.user
    
    if (token) {
      localStorage.setItem('access_token', token)
      logger.debug('Token saved successfully')
    }
    
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
      logger.info('User logged in', { email: user.email, role: user.role })
    }
    
    return response
  },

  getProfile: async () => {
    const response = await api.get('/api/auth/profile')
    
    // ✅ Backend trả về: { status: 'success', data: { id, full_name, email, role } }
    const userData = response.data.data || response.data
    
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData))
      logger.debug('Profile loaded', { email: userData.email })
    }
    
    return response
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
  },
}

// ==================== CLASS APIs ====================

export const classAPI = {
  create: async (data: { name: string; course_code?: string; description?: string }) => {
    return api.post('/api/classes', data)
  },

  getAll: async () => {
    return api.get('/api/classes')
  },

  getById: async (id: number) => {
    return api.get(`/api/classes/${id}`)
  },

  update: async (id: number, data: { name?: string; course_code?: string; description?: string }) => {
    return api.put(`/api/classes/${id}`, data)
  },

  delete: async (id: number) => {
    return api.delete(`/api/classes/${id}`)
  },

  getStudents: async (id: number) => {
    return api.get(`/api/classes/${id}/students`)
  },

  join: async (inviteCode: string) => {
    return api.post('/api/classes/join', { invite_code: inviteCode })
  },
}

// ==================== PROBLEM APIs ====================

export const problemAPI = {
  create: async (
    classId: number,
    data: {
      title: string
      description: string
      difficulty: 'easy' | 'medium' | 'hard'
      language: 'cpp' | 'python' | 'java'
      function_signature: string
      time_limit_ms?: number
      memory_limit_kb?: number
      test_cases: Array<{
        inputs: Array<{ type: string; value: any }>
        expected_output: { type: string; value: any }
        is_hidden: boolean
        points: number
      }>
    }
  ) => {
    return api.post(`/api/classes/${classId}/problems`, data)
  },

  getByClass: async (classId: number) => {
    return api.get(`/api/classes/${classId}/problems`)
  },

  getById: async (id: number) => {
    return api.get(`/api/problems/${id}`)
  },

  getSubmissions: async (id: number, page: number = 1, perPage: number = 20) => {
    return api.get(`/api/problems/${id}/submissions`, {
      params: { page, per_page: perPage }
    })
  },
}

// ==================== SUBMISSION APIs ====================

export const submissionAPI = {
  create: async (data: { problem_id: number; source_code: string; language?: string }) => {
    return api.post('/api/submissions', data)
  },

  getById: async (id: number) => {
    return api.get(`/api/submissions/${id}`)
  },

  getMySubmissions: async (problemId?: number) => {
    const params = problemId ? { problem_id: problemId } : {}
    return api.get('/api/submissions/me', { params })
  },

  getCode: async (id: number) => {
    return api.get(`/api/submissions/${id}/code`)
  },

  // NEW: Run code without saving to database (for testing before submit)
  runCode: async (data: { problem_id: number; source_code: string; language?: string }) => {
    return api.post('/api/submissions/run', data)
  },
}

// ==================== STUDENT APIs ====================

export const studentAPI = {
  getProblemsStatus: async (classId: number) => {
    return api.get(`/api/students/me/classes/${classId}/problems-status`)
  },

  getMyProgress: async () => {
    return api.get('/api/students/me/progress')
  },
}

// ==================== HELPER FUNCTIONS ====================

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('access_token')
}

export const getUser = () => {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
}

export const getUserRole = (): 'teacher' | 'student' | null => {
  const user = getUser()
  // Backend returns role as a string, not an object
  return user?.role || null
}

// Export axios instance for custom requests
export default api
