# So sánh chức năng Frontend mới vs Backend hiện tại

## 📊 TỔNG QUAN

### Frontend mới (Next.js 15)
- **Framework**: Next.js 15.2.4 + TypeScript
- **UI**: Radix UI + Tailwind CSS (Neobrutalism design)
- **Code Editor**: Monaco Editor
- **State**: React Hooks + Mock Data

### Backend hiện tại (Flask)
- **Framework**: Flask + SQLAlchemy
- **Auth**: JWT (Flask-JWT-Extended)
- **Database**: PostgreSQL
- **Queue**: RabbitMQ

---

## ✅ CHỨC NĂNG FRONTEND MỚI CÓ - BACKEND ĐÃ CÓ

### 1. **Authentication (Đã khớp)**
| Chức năng | Frontend | Backend | Status |
|-----------|----------|---------|--------|
| Register | ✅ `/register` | ✅ `POST /api/auth/register` | ✅ Khớp |
| Login | ✅ `/login` | ✅ `POST /api/auth/login` | ✅ Khớp |
| Role Selection | ✅ Student/Teacher | ✅ role_id (student/teacher) | ✅ Khớp |
| Get Profile | ❌ Chưa có | ✅ `GET /api/auth/profile` | ⚠️ Backend có thêm |

### 2. **Class Management (Đã khớp cơ bản)**
| Chức năng | Frontend | Backend | Status |
|-----------|----------|---------|--------|
| Create Class (Teacher) | ✅ Dialog component | ✅ `POST /api/classes` | ✅ Khớp |
| List Classes | ✅ Dashboard | ✅ `GET /api/classes` | ✅ Khớp |
| Join Class (Student) | ✅ Dialog với invite code | ✅ `POST /api/classes/join` | ✅ Khớp |
| Class Details | ✅ `/teacher/class/[id]` | ❌ Chưa có endpoint | ⚠️ Frontend có thêm |
| Student List | ✅ UI hiển thị | ❌ Chưa có endpoint | ⚠️ Frontend có thêm |

**Fields trong Class:**
- Frontend: `id, name, description, code, teacherId, createdAt, studentCount`
- Backend: `id, name, course_code, invite_code, teacher_id, created_at`
- ⚠️ **Khác biệt**: 
  - Frontend có `description` và `studentCount` (tính toán)
  - Backend có `invite_code` (để join class)
  - Frontend dùng `code` (course code), Backend dùng `course_code`

### 3. **Problem Management (Có khác biệt đáng kể)**
| Chức năng | Frontend | Backend | Status |
|-----------|----------|---------|--------|
| Create Problem | ✅ `/teacher/class/[id]/create-problem` | ✅ `POST /api/classes/<id>/problems` | ✅ Khớp |
| List Problems | ✅ Class detail page | ✅ `GET /api/classes/<id>/problems` | ✅ Khớp |
| Problem Details | ✅ `/student/problem/[id]` | ✅ `GET /api/problems/<id>` | ✅ Khớp |
| Edit Problem | ❌ Chưa có | ❌ Chưa có | ❌ Cả hai chưa có |
| Delete Problem | ❌ Chưa có | ❌ Chưa có | ❌ Cả hai chưa có |

**Fields trong Problem:**
- **Frontend có mà Backend CHƯA có:**
  - ✅ `difficulty` (easy/medium/hard)
  - ✅ `gradingMode` (stdio/function)
  - ✅ `functionSignature` (cho function grading)
  
- **Backend có:**
  - ✅ `title, description, time_limit_ms, memory_limit_kb, due_date, class_id`
  
- **Frontend có:**
  - ✅ `title, description, timeLimit, memoryLimit, difficulty, gradingMode, functionSignature, testCases`

**⚠️ QUAN TRỌNG - Cần thêm vào Backend:**
```python
# Cần thêm vào models.py - Problem
difficulty = Column(String(20))  # 'easy', 'medium', 'hard'
grading_mode = Column(String(20))  # 'stdio', 'function'
function_signature = Column(Text)  # Cho function grading
```

### 4. **Test Cases (Có khác biệt quan trọng)**
| Field | Frontend | Backend | Status |
|-------|----------|---------|--------|
| input | ✅ `input` | ✅ `input_data` | ⚠️ Tên khác |
| expected_output | ✅ `expectedOutput` | ✅ `expected_output` | ⚠️ Tên khác |
| is_hidden | ✅ `isHidden` | ✅ `is_hidden` | ✅ Khớp |
| points | ✅ `points` | ❌ **CHƯA CÓ** | ⚠️ **Cần thêm** |

**⚠️ Cần thêm vào Backend:**
```python
# Cần thêm vào models.py - TestCase
points = Column(Integer, default=10)  # Điểm cho mỗi test case
```

### 5. **Submission System (Đã khớp cơ bản)**
| Chức năng | Frontend | Backend | Status |
|-----------|----------|---------|--------|
| Submit Code | ✅ Code editor + submit | ✅ `POST /api/submissions` | ✅ Khớp |
| View Submission | ✅ Results display | ✅ `GET /api/submissions/<id>` | ✅ Khớp |
| Submission History | ✅ History dialog | ❌ Chưa có endpoint | ⚠️ Frontend có thêm |
| Real-time Status | ✅ UI polling/updates | ❌ Chưa có WebSocket | ⚠️ Frontend có thêm |

**Fields trong Submission:**
- Frontend: `id, problemId, studentId, code, language, status, score, totalTests, passedTests, submittedAt`
- Backend: `id, problem_id, student_id, source_code, language, status, submitted_at`

**⚠️ Backend CHƯA có:**
- `score` (tổng điểm) - cần tính từ SubmissionResult
- `totalTests`, `passedTests` - cần tính từ test cases

### 6. **Submission Results (Đã khớp)**
| Field | Frontend | Backend | Status |
|-------|----------|---------|--------|
| test_case_id | ✅ | ✅ | ✅ Khớp |
| status | ✅ | ✅ | ✅ Khớp |
| execution_time_ms | ✅ | ✅ | ✅ Khớp |
| memory_used_kb | ✅ | ✅ | ✅ Khớp |
| output | ✅ (hiển thị) | ✅ `output_received` | ✅ Khớp |
| error_message | ✅ | ✅ | ✅ Khớp |

---

## 🔴 CHỨC NĂNG FRONTEND CÓ - BACKEND CHƯA CÓ

### 1. **Problem Difficulty Levels**
- Frontend: Hiển thị badges "easy", "medium", "hard"
- Backend: **CHƯA CÓ field `difficulty`**
- **Cần làm**: Thêm column `difficulty` vào bảng `problems`

### 2. **Grading Modes (Quan trọng!)**
- Frontend: Hỗ trợ 2 modes:
  - `stdio`: Standard Input/Output (hiện tại backend đang làm)
  - `function`: Function grading (nộp hàm, không có main)
- Backend: **CHƯA CÓ**
- **Cần làm**: 
  - Thêm `grading_mode` và `function_signature` vào database
  - Cập nhật grader engine để hỗ trợ function grading

### 3. **Test Case Points System**
- Frontend: Mỗi test case có `points` riêng
- Backend: **CHƯA CÓ** - hiện tại không có hệ thống điểm
- **Cần làm**: 
  - Thêm column `points` vào bảng `test_cases`
  - Tính tổng điểm submission dựa trên test cases passed

### 4. **Class Description**
- Frontend: Mỗi class có `description` đầy đủ
- Backend: **CHƯA CÓ field `description`**
- **Cần làm**: Thêm column `description` vào bảng `classes`

### 5. **Student Count in Class**
- Frontend: Hiển thị số lượng student: `studentCount`
- Backend: **CHƯA CÓ endpoint** để lấy
- **Cần làm**: Thêm field computed hoặc join count

### 6. **Submission History by Problem**
- Frontend: Hiển thị lịch sử nộp bài theo problem
- Backend: **CHƯA CÓ endpoint** `GET /api/problems/<id>/submissions`
- **Cần làm**: Tạo endpoint mới

### 7. **Class Members List**
- Frontend: Hiển thị danh sách students trong class
- Backend: **CHƯA CÓ endpoint** `GET /api/classes/<id>/students`
- **Cần làm**: Tạo endpoint mới

### 8. **Student Statistics**
- Frontend: Hiển thị thống kê "3 Done, 2 Todo"
- Backend: **CHƯA CÓ endpoint** để tính
- **Cần làm**: Endpoint thống kê progress của student

### 9. **Problem Statistics for Teacher**
- Frontend: Teacher dashboard có thống kê submissions
- Backend: **CHƯA CÓ endpoint**
- **Cần làm**: Endpoint thống kê cho teacher

---

## 🟢 CHỨC NĂNG BACKEND CÓ - FRONTEND CHƯA DÙNG

### 1. **User Profile Endpoint**
- Backend: `GET /api/auth/profile` (có JWT)
- Frontend: **Chưa gọi API này**
- **Cần làm**: Tích hợp để lấy user info

### 2. **Internal Routes (Worker callbacks)**
- Backend: `POST /api/internal/submissions/<id>/result`
- Frontend: **Không cần** (internal only)
- Status: ✅ OK

### 3. **Health Check**
- Backend: `GET /api/health`
- Frontend: **Chưa dùng**
- **Cần làm**: Có thể dùng cho monitoring

### 4. **Due Date for Problems**
- Backend: `due_date` field trong Problem
- Frontend: **CHƯA HIỂN THỊ**
- **Cần làm**: Thêm UI hiển thị deadline

### 5. **Swagger Documentation**
- Backend: `/static/swagger.json`
- Frontend: **Không cần**
- Status: ✅ OK (for API docs)

---

## 🔧 DANH SÁCH API CẦN TẠO MỚI

### Priority 1 - Cần gấp cho tích hợp cơ bản:
```python
# 1. Class details with students
GET /api/classes/<int:class_id>
Response: {
  "id": 1,
  "name": "Data Structures",
  "description": "...",
  "course_code": "CS301",
  "invite_code": "ABC123",
  "teacher": {...},
  "student_count": 24,
  "students": [...]
}

# 2. Student list in class
GET /api/classes/<int:class_id>/students
Response: [
  {"id": 1, "name": "John Doe", "email": "john@example.com", "enrolled_at": "..."}
]

# 3. Submission history for a problem
GET /api/problems/<int:problem_id>/submissions
Response: [
  {"id": 1, "student_id": 1, "status": "accepted", "score": 100, ...}
]

# 4. Student's own submissions
GET /api/students/me/submissions?problem_id=<id>
Response: [...]
```

### Priority 2 - Cần cho statistics:
```python
# 5. Student progress in class
GET /api/classes/<int:class_id>/students/<int:student_id>/progress
Response: {
  "total_problems": 10,
  "completed": 7,
  "in_progress": 2,
  "not_started": 1
}

# 6. Teacher dashboard stats
GET /api/teachers/me/stats
Response: {
  "total_classes": 3,
  "total_students": 56,
  "total_problems": 24,
  "recent_submissions": [...]
}
```

### Priority 3 - Cần cho admin:
```python
# 7. Update problem
PUT /api/problems/<int:problem_id>

# 8. Delete problem
DELETE /api/problems/<int:problem_id>

# 9. Remove student from class
DELETE /api/classes/<int:class_id>/students/<int:student_id>
```

---

## 📝 DANH SÁCH DATABASE MIGRATIONS CẦN CHẠY

```python
# Migration: Add missing fields to Problem table
def upgrade():
    op.add_column('problems', sa.Column('difficulty', sa.String(20)))
    op.add_column('problems', sa.Column('grading_mode', sa.String(20), default='stdio'))
    op.add_column('problems', sa.Column('function_signature', sa.Text))
    
    # Migration: Add description to Class table
    op.add_column('classes', sa.Column('description', sa.Text))
    
    # Migration: Add points to TestCase table
    op.add_column('test_cases', sa.Column('points', sa.Integer, default=10))
    
    # Migration: Add score fields to Submission (computed)
    # Có thể dùng SQL view hoặc computed field
```

---

## 🎯 KẾ HOẠCH TÍCH HỢP

### Phase 1: Database Schema Updates (1-2 giờ)
1. ✅ Tạo migration files
2. ✅ Thêm các fields mới vào models
3. ✅ Chạy migrations
4. ✅ Test database changes

### Phase 2: Backend API Extensions (3-4 giờ)
1. ✅ Thêm endpoints cho class details & students
2. ✅ Thêm endpoints cho submission history
3. ✅ Cập nhật Problem create/update với fields mới
4. ✅ Thêm computed fields cho statistics

### Phase 3: Frontend Integration (4-6 giờ)
1. ✅ Tạo API service layer (`services/api.ts`)
2. ✅ Thay thế mock data bằng real API calls
3. ✅ Thêm error handling & loading states
4. ✅ Tích hợp JWT authentication
5. ✅ Test end-to-end

### Phase 4: Advanced Features (optional)
1. ⏳ Function grading mode trong grader engine
2. ⏳ Real-time submission updates (WebSocket)
3. ⏳ Advanced statistics & analytics
4. ⏳ Code plagiarism detection

---

## 🚨 VẤN ĐỀ CẦN LƯU Ý

### 1. **Naming Conventions**
- Frontend: camelCase (TypeScript)
- Backend: snake_case (Python)
- **Giải pháp**: Transform trong API service layer

### 2. **Date Handling**
- Frontend: JavaScript Date objects
- Backend: ISO 8601 strings
- **Giải pháp**: Parse/serialize trong API layer

### 3. **Authentication**
- Frontend: Chưa có JWT storage/refresh logic
- Backend: JWT với expiry
- **Giải pháp**: Implement JWT storage + auto-refresh

### 4. **Error Handling**
- Frontend: Console.log only
- Backend: Proper error responses
- **Giải pháp**: Implement global error handler

### 5. **CORS Configuration**
- Backend cần enable CORS cho Next.js dev server
- **Giải pháp**: Update Flask CORS settings

---

---

## 🔍 PHÂN TÍCH BỔ SUNG - CÁC TÍNH NĂNG CHI TIẾT

### 1. **Teacher Problem Detail Page** (`/teacher/problem/[id]`)
Frontend có 3 tabs:
- **All Submissions**: Xem tất cả submissions của students
  - API cần: `GET /api/problems/<id>/submissions` ❌
  - Hiển thị: student info, status, score, timestamp
  - Có nút "View Code" để xem source code
  
- **Problem Details**: Xem cấu hình problem
  - Time limit, memory limit, grading mode
  - Function signature (nếu có)
  - Test cases list
  
- **Statistics**: Thống kê
  - Acceptance rate
  - Average score
  - Distribution của statuses
  - API cần: `GET /api/problems/<id>/statistics` ❌

### 2. **Student Problem Solving Page** (`/student/problem/[id]`)
Features đầy đủ:
- **Split View**: Problem description bên trái, Code editor bên phải
- **Monaco Editor**: Code editor giống VS Code
  - Syntax highlighting
  - Line numbers
  - Auto-complete
  - Custom theme "codegrader-dark"
  
- **Language Selection**: Dropdown chọn ngôn ngữ (cpp, python, java, etc.)
  - Backend hiện chỉ support cpp
  - ⚠️ Cần extend grader engine
  
- **Test Results Display**: 
  - Real-time hiển thị kết quả từng test case
  - Show input, output, expected output khi failed
  - Execution time & memory usage
  - API response cần: detailed test results
  
- **Submission History**: 
  - Dialog hiển thị all previous submissions
  - Load lại code từ submission cũ
  - API cần: `GET /api/students/me/submissions?problem_id=<id>` ❌

### 3. **Create Problem Page** (`/teacher/class/[id]/create-problem`)
Form rất chi tiết:
- **Basic Info**: title, description
- **Constraints**: timeLimit, memoryLimit
- **Difficulty**: easy/medium/hard (❌ Backend chưa có)
- **Grading Mode**: stdio/function (❌ Backend chưa có)
  - Nếu chọn function: Cần nhập function signature
  
- **Test Cases Manager**:
  - Dynamic add/remove test cases
  - Mỗi test case có:
    - Input (textarea)
    - Expected Output (textarea)
    - Hidden/Visible toggle (✅ Backend có)
    - **Points** (❌ Backend CHƯA CÓ)
  - Total points calculator

### 4. **Class Detail Page - Teacher** (`/teacher/class/[id]`)
3 Tabs với nhiều tính năng:

**Tab 1: Assignments**
- List all problems trong class
- Create new assignment button
- Mỗi problem hiển thị:
  - Title, difficulty badge, grading mode badge
  - Time/memory limits
  - Created date
  - "View" button → Teacher problem detail page
  - API cần: `GET /api/classes/<id>/problems` (✅ có rồi)

**Tab 2: Students**
- List all students trong class với info:
  - Name, email, enrolled date
  - Progress (problems completed/total)
  - API cần: `GET /api/classes/<id>/students` ❌
  - API cần: `GET /api/classes/<id>/students/<student_id>/progress` ❌
  
- "Add Student" button (manual add)
  - API cần: `POST /api/classes/<id>/students` ❌

**Tab 3: Settings**
- Class info (name, code, description)
- Invite code display & regenerate
- Delete class option
- API cần: 
  - `PUT /api/classes/<id>` ❌
  - `POST /api/classes/<id>/regenerate-code` ❌
  - `DELETE /api/classes/<id>` ❌

### 5. **Class Detail Page - Student** (`/student/class/[id]`)
- List problems với submission status:
  - "Accepted" badge (green) nếu đã pass
  - "Not Started" badge (yellow) nếu chưa làm
  - "Failed" badge (red) nếu failed
  - Score display nếu đã submit
  - Number of attempts
- API cần: `GET /api/students/me/classes/<id>/problems-status` ❌

### 6. **Navbar Component**
Features:
- Logo & branding
- Theme toggle (Dark/Light mode)
  - ✅ Frontend có ThemeProvider
  - Backend không cần xử lý (client-side only)
- User info display (name, role badge)
- Logout button
  - Hiện tại chỉ navigate, chưa clear token
  - ⚠️ Cần implement proper JWT logout

### 7. **Create/Join Class Dialogs**
**Create Class Dialog** (Teacher):
- Form fields: name, code, description
- Backend API: `POST /api/classes` ✅
- ⚠️ Backend cần thêm `description` field

**Join Class Dialog** (Student):
- Input: class code (auto uppercase)
- Backend API: `POST /api/classes/join` ✅
- ⚠️ Nhưng backend dùng `invite_code`, frontend dùng `code`
  - Cần clarify: `course_code` vs `invite_code`?

---

## 🚨 CÁC VẤN ĐỀ PHÁT HIỆN THÊM

### 1. **Confusion về Class Code**
Backend có 2 codes:
- `course_code`: Code của khóa học (CS301)
- `invite_code`: Code để join class (random UUID)

Frontend chỉ có 1 field:
- `code`: Hiện dùng như course_code

**⚠️ CẦN QUYẾT ĐỊNH:**
- Option A: `code` = `course_code` (hiển thị), `invite_code` riêng (join)
- Option B: Bỏ `course_code`, chỉ dùng `invite_code` cho cả 2 mục đích

### 2. **Language Support**
Frontend: Dropdown chọn nhiều languages (cpp, python, java, javascript)
Backend: Chỉ support cpp

**Cần làm:**
- Grader engine hỗ trợ multi-language
- Hoặc giới hạn frontend chỉ hiển thị cpp

### 3. **Real-time Updates**
Frontend: UI poll/check status của submissions
Backend: Không có WebSocket/SSE

**Giải pháp:**
- Phase 1: Client polling (đơn giản)
- Phase 2: Implement WebSocket (advanced)

### 4. **Code View for Teacher**
Frontend: Có nút "View Code" trong submission list
Backend: Chưa có endpoint trả về source code

**API cần:**
```python
GET /api/submissions/<id>/code
Response: {
  "code": "...",
  "language": "cpp"
}
```

### 5. **Submission Test Results Detail**
Frontend hiển thị rất chi tiết:
- Mỗi test case: status, time, memory
- Nếu failed: input, actual output, expected output

Backend `SubmissionResult` có:
- test_case_id, status, execution_time_ms, memory_used_kb
- output_received, error_message

**⚠️ Cần verify:** Backend có trả đủ thông tin test case (input, expected) không?

---

## 📋 DANH SÁCH API ĐẦY ĐỦ CẦN TẠO/CẬP NHẬT

### ✅ ĐÃ CÓ (nhưng cần update response format)
```python
# 1. Auth APIs - ✅ OK
POST /api/auth/register
POST /api/auth/login
GET /api/auth/profile

# 2. Class APIs - ⚠️ Cần thêm description
POST /api/classes
GET /api/classes
POST /api/classes/join

# 3. Problem APIs - ⚠️ Cần thêm difficulty, grading_mode, function_signature
POST /api/classes/<id>/problems
GET /api/classes/<id>/problems
GET /api/problems/<id>

# 4. Submission APIs - ⚠️ Cần computed fields (score, total/passed tests)
POST /api/submissions
GET /api/submissions/<id>
```

### ❌ CHƯA CÓ - CẦN TẠO MỚI (Priority 1)
```python
# Class Management
GET /api/classes/<id>  # Chi tiết class + teacher info + student count
GET /api/classes/<id>/students  # List students trong class
POST /api/classes/<id>/students  # Add student manually (optional)
PUT /api/classes/<id>  # Update class info
DELETE /api/classes/<id>  # Delete class

# Problem Management
GET /api/problems/<id>/submissions  # All submissions cho 1 problem
GET /api/problems/<id>/statistics  # Statistics (acceptance rate, avg score)
PUT /api/problems/<id>  # Update problem (optional)
DELETE /api/problems/<id>  # Delete problem (optional)

# Submission Management
GET /api/students/me/submissions  # Student's own submissions (có filter by problem)
GET /api/submissions/<id>/code  # Get source code of submission
GET /api/students/me/classes/<id>/problems-status  # Status of all problems in class

# Student Progress
GET /api/classes/<id>/students/<student_id>/progress
# Response: {total_problems, completed, in_progress, not_started, scores}

# Teacher Statistics
GET /api/teachers/me/stats
# Response: {total_classes, total_students, total_problems, recent_submissions}
```

### ❌ CHƯA CÓ - NICE TO HAVE (Priority 2)
```python
# Class invite code management
POST /api/classes/<id>/regenerate-invite-code

# Bulk operations
POST /api/problems/<id>/test-cases/bulk  # Bulk add test cases
DELETE /api/classes/<id>/students/<student_id>  # Remove student

# Advanced features
GET /api/problems/<id>/leaderboard  # Top submissions
POST /api/submissions/<id>/regrade  # Regrade submission
```

---

## 📊 DATABASE SCHEMA UPDATES - ĐẦY ĐỦ

```python
# Migration 1: Add to Problems table
class Problem:
    # ... existing fields ...
    difficulty = Column(String(20))  # 'easy', 'medium', 'hard'
    grading_mode = Column(String(20), default='stdio')  # 'stdio', 'function'
    function_signature = Column(Text, nullable=True)
    
# Migration 2: Add to Classes table
class Class:
    # ... existing fields ...
    description = Column(Text)
    
# Migration 3: Add to TestCases table
class TestCase:
    # ... existing fields ...
    points = Column(Integer, default=10)

# Migration 4: Add computed/cached fields to Submission (optional)
class Submission:
    # ... existing fields ...
    score = Column(Integer)  # Computed from results
    passed_tests = Column(Integer)  # Computed from results
    total_tests = Column(Integer)  # Computed from problem test cases
```

---

## ✨ TỔNG KẾT CUỐI CÙNG

### Frontend mới - Đánh giá chi tiết:
- ✅ **UI/UX**: Xuất sắc - Neobrutalism design đẹp, responsive tốt
- ✅ **Type Safety**: Full TypeScript với proper interfaces
- ✅ **Code Editor**: Monaco Editor tích hợp hoàn hảo
- ✅ **User Experience**: Flow rõ ràng cho cả teacher & student
- ✅ **Features**: Đầy đủ hơn backend rất nhiều
  - Difficulty levels
  - Grading modes (stdio + function)
  - Points system cho test cases
  - Detailed test results
  - Submission history
  - Statistics & progress tracking
- ⚠️ **Data**: Đang dùng mock data, cần tích hợp API

### Backend hiện tại - Đánh giá chi tiết:
- ✅ **Core Logic**: Auth (JWT), CRUD classes/problems/submissions
- ✅ **Grader Engine**: RabbitMQ + Worker architecture tốt
- ✅ **Database**: PostgreSQL với relationships đúng
- ✅ **Security**: JWT, role-based access control
- ⚠️ **Coverage**: Chỉ ~60% features mà frontend cần
- ❌ **Missing Features**:
  - Difficulty & grading modes
  - Points system
  - Detailed statistics
  - Student progress tracking
  - Many read endpoints

### Kết luận - Con số cụ thể:
**Backend cần bổ sung khoảng 40-50% để match với frontend mới.**

**Breakdown công việc:**
1. ✅ Database migrations: 4 tables cần update
2. ✅ API endpoints mới: ~15-20 endpoints
3. ✅ API endpoints update: ~5 endpoints cần thêm fields
4. ✅ Computed fields: Score calculation logic
5. ⏳ Grader engine: Function grading mode (optional Phase 2)
6. ⏳ Multi-language support (optional Phase 2)

**Thời gian ước tính:**
- Phase 1 (Core integration): 12-16 giờ
  - Database: 2 giờ
  - Basic APIs: 6-8 giờ
  - Frontend integration: 4-6 giờ
  
- Phase 2 (Advanced features): 8-12 giờ
  - Statistics endpoints: 3-4 giờ
  - Function grading: 5-8 giờ

**Tổng: 20-28 giờ làm việc để tích hợp hoàn chỉnh.**

Sau khi hoàn thành, hệ thống sẽ là một **production-ready code grading platform** với UI/UX hiện đại và đầy đủ tính năng! 🎉🚀
