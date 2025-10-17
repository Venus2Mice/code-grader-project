# Backend API Endpoints Documentation

## 1. Authentication (`/api/auth`)

### `POST /api/auth/register`
Đăng ký tài khoản người dùng mới.
- **Body**: `{ full_name, email, password, role: 'student'|'teacher' }`
- **Response**: `201 Created` - Tạo tài khoản thành công

### `POST /api/auth/login`
Đăng nhập vào hệ thống.
- **Body**: `{ email, password }`
- **Response**: `200 OK` - Trả về `access_token` (JWT)

### `GET /api/auth/profile`
Lấy thông tin profile của user hiện tại.
- **Auth**: Required (JWT)
- **Response**: `{ id, full_name, email, role }`

---

## 2. Classes (`/api/classes`)

### `POST /api/classes`
Tạo lớp học mới (chỉ teacher).
- **Auth**: Required (Teacher)
- **Body**: `{ name, course_code?, description? }`
- **Response**: `201 Created` - Trả về thông tin lớp và `invite_code`

### `GET /api/classes`
Lấy danh sách lớp học của user (teacher: classes taught | student: classes joined).
- **Auth**: Required
- **Response**: Array of classes với thống kê (student_count, problems_done/todo cho student)

### `POST /api/classes/join`
Sinh viên tham gia lớp bằng invite code.
- **Auth**: Required (Student)
- **Body**: `{ invite_code }`
- **Response**: `200 OK` - Tham gia thành công

### `GET /api/classes/:class_id`
Lấy chi tiết đầy đủ của một lớp.
- **Auth**: Required (member hoặc teacher)
- **Response**: Class details bao gồm danh sách problems

### `GET /api/classes/:class_id/students`
Lấy danh sách sinh viên trong lớp.
- **Auth**: Required (member hoặc teacher)
- **Response**: Array of students `{ id, full_name, email, enrolled_at }`

### `PUT /api/classes/:class_id`
Cập nhật thông tin lớp (chỉ teacher).
- **Auth**: Required (Teacher owner)
- **Body**: `{ name?, course_code?, description? }`
- **Response**: `200 OK` - Class updated

### `DELETE /api/classes/:class_id`
Xóa lớp học (chỉ teacher).
- **Auth**: Required (Teacher owner)
- **Response**: `200 OK` - Class deleted

---

## 3. Problems (`/api/problems`, `/api/classes/:class_id/problems`)

### `POST /api/classes/:class_id/problems`
Tạo bài tập mới trong lớp (chỉ teacher).
- **Auth**: Required (Teacher owner)
- **Body**: 
```json
{
  "title": "string",
  "description": "string",
  "difficulty": "easy|medium|hard",
  "grading_mode": "stdio|function",
  "function_signature": "string (required nếu mode=function)",
  "time_limit_ms": 1000,
  "memory_limit_kb": 256000,
  "test_cases": [
    {
      "input": "string",
      "output": "string",
      "is_hidden": false,
      "points": 10
    }
  ]
}
```
- **Response**: `201 Created` - Problem created

### `GET /api/classes/:class_id/problems`
Lấy danh sách bài tập trong lớp.
- **Auth**: Required
- **Response**: Array of problems (overview)

### `GET /api/problems/:problem_id`
Lấy chi tiết đầy đủ của một bài tập (bao gồm test cases).
- **Auth**: Required
- **Response**: Problem details với test_cases array

### `GET /api/problems/:problem_id/submissions`
Lấy tất cả submissions cho một bài tập (teacher view).
- **Auth**: Required (Teacher)
- **Response**: Array of submissions với scores

---

## 4. Submissions (`/api/submissions`)

### `POST /api/submissions`
Nộp bài làm cho một problem.
- **Auth**: Required (Student)
- **Body**: `{ problem_id, source_code, language: 'cpp'|'python'|'java' }`
- **Response**: `202 Accepted` - Submission đang được chấm (status: Pending)

### `GET /api/submissions/:submission_id`
Lấy kết quả chi tiết của một submission.
- **Auth**: Required (owner hoặc teacher)
- **Response**: Submission với results array, score, passedTests/totalTests

### `GET /api/submissions/me`
Lấy danh sách submissions của student hiện tại.
- **Auth**: Required (Student)
- **Query**: `?problem_id=123` (optional filter)
- **Response**: Array of submissions với scores

### `GET /api/submissions/:submission_id/code`
Lấy source code của submission.
- **Auth**: Required (owner hoặc teacher)
- **Response**: `{ code, language }`

### `POST /api/submissions/run`
Chạy thử code (test run, không lưu vào lịch sử submissions chính thức).
- **Auth**: Required (Student)
- **Body**: `{ problem_id, source_code, language }`
- **Response**: `202 Accepted` - Test submission ID để poll kết quả

---

## 5. Students (`/api/students`)

### `GET /api/students/me/classes/:class_id/problems-status`
Lấy trạng thái làm bài của student trong một lớp cụ thể.
- **Auth**: Required (Student)
- **Response**: Array of problems với submission status (not_started/failed/accepted), best score, attempts

### `GET /api/students/me/progress`
Lấy tổng quan tiến độ học tập của student.
- **Auth**: Required (Student)
- **Response**: 
```json
{
  "total_classes": 5,
  "total_problems": 50,
  "completed_problems": 30,
  "total_submissions": 120
}
```

---

## 6. Internal (`/internal`) - Chỉ dành cho Worker

### `POST /internal/submissions/:submission_id/result`
Cập nhật kết quả chấm điểm từ grader worker.
- **Auth**: None (internal service)
- **Body**:
```json
{
  "overall_status": "Accepted|Compile Error|Runtime Error|...",
  "results": [
    {
      "test_case_id": 1,
      "status": "Passed|Failed|...",
      "execution_time_ms": 150,
      "memory_used_kb": 2048,
      "output_received": "...",
      "error_message": "..."
    }
  ]
}
```
- **Response**: `200 OK` - Result updated

---

## 7. Health Check (`/api`)

### `GET /api/health`
Kiểm tra trạng thái hoạt động của backend.
- **Response**: `{ "status": "healthy" }`

---

## Notes

- **Authentication**: Sử dụng JWT Bearer token trong header `Authorization: Bearer <token>`
- **Role-based Access**: Một số endpoints yêu cầu role cụ thể (teacher/student)
- **Grading Flow**: 
  1. Client POST `/api/submissions` 
  2. Backend lưu submission với status "Pending" và publish task to RabbitMQ
  3. Worker xử lý và POST kết quả về `/internal/submissions/:id/result`
  4. Client poll `/api/submissions/:id` để lấy kết quả
- **Test vs Actual Submissions**: 
  - `/api/submissions/run` tạo submission với `is_test=True` (test run)
  - `/api/submissions` tạo submission chính thức (`is_test=False`)
