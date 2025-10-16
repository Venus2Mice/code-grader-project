import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

if (!import.meta.env.VITE_API_BASE_URL) {
  console.warn("VITE_API_BASE_URL not defined, using default: http://localhost:5000/api");
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Auto-attach token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Optional: Add response error interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Optionally redirect to login
    }
    return Promise.reject(error);
  }
);

// Export after all configuration
export { apiClient };

// API functions
export const login = (credentials) => apiClient.post('/auth/login', credentials);
export const register = (userData) => apiClient.post('/auth/register', userData);
export const getProfile = () => apiClient.get('/auth/profile');

export const getMyClasses = () => apiClient.get('/classes');
export const createClass = (classData) => apiClient.post('/classes', classData);
export const joinClass = (inviteCode) => apiClient.post('/classes/join', { invite_code: inviteCode });

export const getProblemsInClass = (classId) => apiClient.get(`/classes/${classId}/problems`);
export const createProblem = (classId, problemData) => apiClient.post(`/classes/${classId}/problems`, problemData);
export const getProblemDetails = (problemId) => apiClient.get(`/problems/${problemId}`);

export const submitCode = (submissionData) => apiClient.post('/submissions', submissionData);
export const getSubmissionResult = (submissionId) => apiClient.get(`/submissions/${submissionId}`);