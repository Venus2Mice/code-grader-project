# 🚀 INTEGRATION TODO LIST - Frontend Mới + Backend

## 📊 TỔNG QUAN
- **Frontend**: Next.js 15 + TypeScript + Monaco Editor - Hoàn chỉnh với mock data
- **Backend**: Flask + SQLAlchemy + RabbitMQ - Đang thiếu ~40% features
- **Mục tiêu**: Tích hợp hoàn toàn trong 20-28 giờ

---

## ✅ PHASE 1: DATABASE & CORE APIS (12-16h)

### 1.1 Database Migrations (2h)
```bash
# Tạo migration file mới
cd backend
flask db revision -m "add_frontend_required_fields"
```

**Cần thêm vào models.py:**
```python
# Problem model - THÊM 3 fields
difficulty = Column(String(20))  # 'easy', 'medium', 'hard'
grading_mode = Column(String(20), default='stdio')  # 'stdio', 'function'
function_signature = Column(Text, nullable=True)

# Class model - THÊM 1 field
description = Column(Text)

# TestCase model - THÊM 1 field
points = Column(Integer, default=10)
```

### 1.2 Update Existing APIs (3-4h)

#### Auth Routes (✅ Đã OK, chỉ test)
- [x] `POST /api/auth/register`
- [x] `POST /api/auth/login`
- [x] `GET /api/auth/profile`

#### Class Routes (⚠️ Cần update response)
- [ ] `POST /api/classes` - Thêm `description` trong request/response
- [ ] `GET /api/classes` - Thêm `description` và `student_count` trong response
- [ ] `POST /api/classes/join` - Giữ nguyên

#### Problem Routes (⚠️ Cần update)
- [ ] `POST /api/classes/<id>/problems` - Thêm: difficulty, grading_mode, function_signature, points cho test cases
- [ ] `GET /api/classes/<id>/problems` - Thêm fields mới trong response
- [ ] `GET /api/problems/<id>` - Thêm fields mới + test cases với points

#### Submission Routes (⚠️ Cần computed fields)
- [ ] `POST /api/submissions` - Giữ nguyên
- [ ] `GET /api/submissions/<id>` - Thêm: score (tính từ points), passed_tests, total_tests

### 1.3 New Essential APIs (6-8h)

#### Class Management
```python
# 1. GET /api/classes/<id>
# Response: Full class info + teacher + student_count
{
  "id": 1,
  "name": "Data Structures",
  "description": "...",
  "course_code": "CS301",
  "invite_code": "abc123",
  "teacher": {"id": 1, "name": "John Doe"},
  "student_count": 24,
  "created_at": "..."
}

# 2. GET /api/classes/<id>/students
# Response: List of students with enrollment date
[
  {"id": 1, "name": "Jane", "email": "jane@", "enrolled_at": "..."}
]

# 3. PUT /api/classes/<id> (Optional - cho Settings tab)
# Update name, description, course_code

# 4. DELETE /api/classes/<id> (Optional)
```

#### Problem Management
```python
# 5. GET /api/problems/<id>/submissions
# Response: All submissions for this problem (teacher view)
[
  {
    "id": 1,
    "student": {"id": 1, "name": "Jane", "email": "jane@"},
    "status": "accepted",
    "score": 100,
    "passed_tests": 5,
    "total_tests": 5,
    "submitted_at": "..."
  }
]
```

#### Submission & Progress
```python
# 6. GET /api/students/me/submissions?problem_id=<id>
# Response: Student's own submission history
[
  {
    "id": 1,
    "problem_id": 1,
    "status": "accepted",
    "score": 100,
    "code": "...",  # Include source code
    "language": "cpp",
    "submitted_at": "..."
  }
]

# 7. GET /api/students/me/classes/<id>/problems-status
# Response: Status of all problems in class
[
  {
    "problem_id": 1,
    "title": "Two Sum",
    "difficulty": "easy",
    "status": "accepted",  # or "not_started", "failed"
    "best_score": 100,
    "attempts": 2
  }
]

# 8. GET /api/submissions/<id>/code
# Response: Source code (for "View Code" button)
{
  "code": "...",
  "language": "cpp"
}
```

---

## ✅ PHASE 2: FRONTEND INTEGRATION (4-6h)

### 2.1 Setup API Service Layer (1h)
```typescript
// frontend-new/services/api.ts
import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// JWT interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  getProfile: () => api.get('/api/auth/profile'),
}

// Class APIs
export const classAPI = {
  create: (data) => api.post('/api/classes', data),
  getAll: () => api.get('/api/classes'),
  getById: (id) => api.get(`/api/classes/${id}`),
  getStudents: (id) => api.get(`/api/classes/${id}/students`),
  join: (inviteCode) => api.post('/api/classes/join', { invite_code: inviteCode }),
}

// Problem APIs
export const problemAPI = {
  create: (classId, data) => api.post(`/api/classes/${classId}/problems`, data),
  getByClass: (classId) => api.get(`/api/classes/${classId}/problems`),
  getById: (id) => api.get(`/api/problems/${id}`),
  getSubmissions: (id) => api.get(`/api/problems/${id}/submissions`),
}

// Submission APIs
export const submissionAPI = {
  create: (data) => api.post('/api/submissions', data),
  getById: (id) => api.get(`/api/submissions/${id}`),
  getMySubmissions: (problemId?) => 
    api.get('/api/students/me/submissions', { params: { problem_id: problemId } }),
  getCode: (id) => api.get(`/api/submissions/${id}/code`),
}

// Student APIs
export const studentAPI = {
  getProblemsStatus: (classId) => 
    api.get(`/api/students/me/classes/${classId}/problems-status`),
}

export default api
```

### 2.2 Replace Mock Data (2-3h)
**Thay thế từng page một:**
- [ ] Login page → Call authAPI.login, save token
- [ ] Register page → Call authAPI.register
- [ ] Student dashboard → Call classAPI.getAll
- [ ] Student class detail → Call studentAPI.getProblemsStatus
- [ ] Student problem page → Call problemAPI.getById, submissionAPI.create
- [ ] Teacher dashboard → Call classAPI.getAll
- [ ] Teacher class detail → Call classAPI.getById, classAPI.getStudents
- [ ] Teacher create problem → Call problemAPI.create
- [ ] Teacher problem detail → Call problemAPI.getSubmissions

### 2.3 Add Error Handling & Loading States (1-2h)
```typescript
// Example: Student dashboard with loading/error
'use client'
import { useEffect, useState } from 'react'
import { classAPI } from '@/services/api'

export default function StudentDashboard() {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await classAPI.getAll()
        setClasses(response.data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchClasses()
  }, [])
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  
  return (/* UI với real data */)
}
```

### 2.4 Environment Configuration (30min)
```bash
# frontend-new/.env.local
NEXT_PUBLIC_API_URL=http://localhost:5000
```

```bash
# backend/.env (update CORS)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

---

## ⏳ PHASE 3: STATISTICS & ADVANCED (8-12h - Optional)

### 3.1 Statistics Endpoints (3-4h)
```python
# GET /api/problems/<id>/statistics
{
  "total_submissions": 45,
  "unique_students": 18,
  "acceptance_rate": 0.67,
  "average_score": 78.5,
  "status_distribution": {
    "accepted": 12,
    "wrong_answer": 4,
    "time_limit": 2
  }
}

# GET /api/classes/<id>/students/<student_id>/progress
{
  "total_problems": 10,
  "completed": 7,
  "in_progress": 2,
  "not_started": 1,
  "average_score": 85.3
}

# GET /api/teachers/me/stats
{
  "total_classes": 3,
  "total_students": 56,
  "total_problems": 24,
  "recent_submissions": [...]
}
```

### 3.2 Function Grading Mode (5-8h)
**Grader Engine Changes:**
- Parse function signature
- Generate wrapper code with test cases
- Compile & run như hiện tại
- So sánh return values thay vì stdout

---

## 🧪 TESTING PLAN

### Backend Testing
```bash
# 1. Test migrations
cd backend
flask db upgrade
flask db-seed  # Seed với data mới có difficulty, grading_mode

# 2. Test APIs với curl/Postman
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Test","email":"test@test.com","password":"123","role":"student"}'

# 3. Test submission flow end-to-end
```

### Frontend Testing
```bash
# 1. Start dev server
cd frontend-new
pnpm dev

# 2. Manual testing checklist
- [ ] Register new user
- [ ] Login
- [ ] Student: Join class
- [ ] Student: View problems
- [ ] Student: Submit code
- [ ] Student: View results
- [ ] Teacher: Create class
- [ ] Teacher: Create problem
- [ ] Teacher: View submissions
```

---

## 📝 DEPLOYMENT CHECKLIST

### Before Production:
- [ ] All migrations tested
- [ ] All new APIs have proper error handling
- [ ] JWT token refresh logic (optional)
- [ ] Rate limiting on APIs
- [ ] CORS properly configured
- [ ] Environment variables set
- [ ] Database backup before migration
- [ ] Frontend build successfully
- [ ] End-to-end smoke tests pass

---

## 🎯 SUCCESS CRITERIA

✅ **Phase 1 Complete when:**
- All database migrations applied
- 8 new APIs working
- Existing APIs updated
- Postman tests pass

✅ **Phase 2 Complete when:**
- No more mock data in frontend
- All pages call real APIs
- JWT auth flow working
- Loading/error states implemented

✅ **Phase 3 Complete when:**
- Statistics showing real data
- Function grading works (optional)
- Multi-language support (optional)

✅ **Full Integration Complete when:**
- Student can: Register → Join class → Solve problems → View results
- Teacher can: Register → Create class → Create problems → View submissions
- All features from frontend mockups working with real backend

---

## 🚨 RISKS & MITIGATION

| Risk | Impact | Mitigation |
|------|--------|------------|
| Migration breaks prod DB | High | Test on staging first, have rollback plan |
| API performance issues | Medium | Add pagination, caching, indexing |
| CORS issues | Low | Test early, configure properly |
| JWT expiry handling | Medium | Implement refresh token or extend expiry |
| Frontend build size | Low | Code splitting already handled by Next.js |

---

## 📞 NEXT STEPS

**Bạn muốn bắt đầu:**
1. ✅ Phase 1.1: Tạo migrations ngay?
2. ✅ Phase 1.2: Update existing APIs?
3. ✅ Phase 1.3: Tạo new APIs?
4. ✅ Phase 2: Frontend integration?

**Hoặc bạn muốn tôi:**
- Tạo migration file cụ thể?
- Viết code cho một API endpoint cụ thể?
- Setup API service layer trong frontend?
- Tạo test suite?

Hãy cho tôi biết! 🚀
