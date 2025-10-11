// src/services/api.js

import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
    console.error("VITE_API_BASE_URL is not defined in .env file");
  }
  
  const apiClient = axios.create({
    // Sử dụng biến môi trường ở đây
    baseURL: API_BASE_URL, 
    headers: {
      'Content-Type': 'application/json',
    },
  });

// BƯỚC 2: SAU KHI ĐÃ CÓ BIẾN, BÂY GIỜ MỚI SỬ DỤNG NÓ
// Interceptor: Tự động đính kèm token vào mỗi request
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

// BƯỚC 3: EXPORT CÁC HÀM SỬ DỤNG BIẾN ĐÃ CẤU HÌNH HOÀN CHỈNH
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