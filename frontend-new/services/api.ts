import axios, { AxiosInstance, AxiosError } from 'axios'

// Base API URL - sẽ lấy từ env variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// Debug log
console.log('🔗 API Base URL:', API_BASE_URL)
console.log('🔑 ENV Value:', process.env.NEXT_PUBLIC_API_URL)

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
        console.warn('🔐 Token expired or invalid. Redirecting to login...')
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        
        // Dispatch event để các component khác biết
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('logout'))
          window.location.href = '/login'
        }
      } else {
        // ✅ Nếu đang ở auth page, log error chi tiết nhưng KHÔNG redirect
        console.error('❌ Authentication failed:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          method: error.config?.method
        })
      }
    }
    
    // Log other errors for debugging
    if (error.response?.status && error.response.status !== 401) {
      console.error(`🔴 API Error [${error.response.status}]:`, {
        url: error.config?.url,
        method: error.config?.method,
        data: error.response?.data
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
      console.log('✅ Token saved:', token.substring(0, 20) + '...')
    }
    
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
      console.log('✅ User saved:', user.email, '- Role:', user.role)
    }
    
    return response
  },

  getProfile: async () => {
    const response = await api.get('/api/auth/profile')
    
    // ✅ Backend trả về: { status: 'success', data: { id, full_name, email, role } }
    const userData = response.data.data || response.data
    
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData))
      console.log('✅ Profile loaded:', userData.email)
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
      grading_mode: 'stdio' | 'function'
      function_signature?: string
      time_limit_ms?: number
      memory_limit_kb?: number
      test_cases: Array<{
        input: string
        output: string
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
