import axios from 'axios'
import type { AxiosInstance, AxiosError } from 'axios'
import { logger } from '@/lib/logger'

// Base API URL - use empty string to let axios use current origin
// Backend routes already have /api prefix, so we just need the base domain
// In Docker: Nginx serves frontend and proxies /api/* to backend
// In dev: Direct connection to backend on localhost:5000
const getApiUrl = () => {
  // Check if running in browser and if it's localhost
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    if (isLocalhost) {
      // Development: direct connection to backend
      return import.meta.env.VITE_API_URL || 'http://localhost:5000'
    } else {
      // Production in Docker: use current origin (Nginx will proxy /api)
      return ''
    }
  }
  // SSR fallback
  return ''
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
    return api.post('/auth/register', data)
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data)
    
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
    const response = await api.get('/auth/profile')
    
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
    return api.post('/classes', data)
  },

  getAll: async () => {
    return api.get('/classes')
  },

  getByToken: async (token: string) => {
    return api.get(`/classes/${token}`)
  },

  update: async (token: string, data: { name?: string; course_code?: string; description?: string }) => {
    return api.put(`/classes/${token}`, data)
  },

  delete: async (token: string) => {
    return api.delete(`/classes/${token}`)
  },

  getStudents: async (token: string) => {
    return api.get(`/classes/${token}/students`)
  },

  addStudent: async (token: string, email: string) => {
    return api.post(`/classes/${token}/students`, { email })
  },

  removeStudent: async (token: string, studentId: number) => {
    return api.delete(`/classes/${token}/students/${studentId}`)
  },

  join: async (inviteCode: string) => {
    return api.post('/classes/join', { invite_code: inviteCode })
  },
}

// ==================== PROBLEM APIs ====================

export const problemAPI = {
  create: async (
    classToken: string,
    data: {
      title: string
      description: string
      markdown_content?: string
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
    return api.post(`/classes/${classToken}/problems`, data)
  },

  createWithDefinition: async (
    classToken: string,
    data: {
      title: string
      description: string
      markdown_content?: string
      difficulty: 'easy' | 'medium' | 'hard'
      language: 'cpp' | 'python' | 'java'
      function_name: string
      return_type: string
      parameters: Array<{ name: string; type: string }>
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
    return api.post(`/classes/${classToken}/problems/define`, data)
  },

  getByClass: async (classToken: string) => {
    return api.get(`/classes/${classToken}/problems`)
  },

  getByToken: async (token: string) => {
    return api.get(`/problems/${token}`)
  },

  update: async (
    problemToken: string,
    data: {
      title?: string
      description?: string
      markdown_content?: string
      difficulty?: 'easy' | 'medium' | 'hard'
      language?: 'cpp' | 'python' | 'java'
      function_name?: string
      return_type?: string
      parameters?: Array<{ name: string; type: string }>
      time_limit_ms?: number
      memory_limit_kb?: number
      test_cases?: Array<{
        inputs: Array<{ type: string; value: any }>
        expected_output: { type: string; value: any }
        is_hidden: boolean
        points: number
      }>
    }
  ) => {
    return api.put(`/problems/${problemToken}`, data)
  },

  getSubmissions: async (token: string, page: number = 1, perPage: number = 20) => {
    return api.get(`/problems/${token}/submissions`, {
      params: { page, per_page: perPage }
    })
  },

  delete: async (problemToken: string) => {
    return api.delete(`/problems/${problemToken}`)
  },
}

// ==================== SUBMISSION APIs ====================

export const submissionAPI = {
  create: async (data: { problem_id: number; source_code: string; language?: string }) => {
    return api.post('/submissions', data)
  },

  getById: async (id: number) => {
    return api.get(`/submissions/${id}`)
  },

  getMySubmissions: async (problemToken?: string) => {
    const params = problemToken ? { problem_token: problemToken } : {}
    return api.get('/submissions/me', { params })
  },

  getCode: async (id: number) => {
    return api.get(`/submissions/${id}/code`)
  },

  // NEW: Run code without saving to database (for testing before submit)
  runCode: async (data: { problem_id: number; source_code: string; language?: string }) => {
    return api.post('/submissions/run', data)
  },

  // NEW: Manual grading by teacher
  manualGrade: async (id: number, data: { manual_score: number; teacher_comment?: string }) => {
    return api.post(`/submissions/${id}/manual-grade`, data)
  },
}

// ==================== STUDENT APIs ====================

export const studentAPI = {
  getProblemsStatus: async (classToken: string) => {
    return api.get(`/students/me/classes/${classToken}/problems-status`)
  },

  getMyProgress: async () => {
    return api.get('/students/me/progress')
  },
}

// ==================== RESOURCE APIs ====================

export const resourceAPI = {
  getByProblem: async (problemToken: string) => {
    return api.get(`/problems/${problemToken}/resources`)
  },

  upload: async (problemToken: string, formData: FormData) => {
    return api.post(`/problems/${problemToken}/resources/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  addDriveLink: async (problemToken: string, data: { drive_link: string; description?: string }) => {
    return api.post(`/problems/${problemToken}/resources/drive-link`, data)
  },

  addExternalLink: async (problemToken: string, data: { file_url: string; file_name: string; description?: string }) => {
    return api.post(`/problems/${problemToken}/resources/external-link`, data)
  },

  delete: async (resourceId: number) => {
    return api.delete(`/resources/${resourceId}`)
  },
}

// ==================== LANGUAGE APIs ====================

export const languageAPI = {
  getPreference: async () => {
    return api.get('/language/preference')
  },

  updatePreference: async (language: 'en' | 'vi') => {
    return api.put('/language/preference', { language })
  },

  getSupportedLanguages: async () => {
    return api.get('/language/supported')
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
