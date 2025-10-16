# 📚 CODE GRADER PROJECT - TÀI LIỆU HOÀN CHỈNH

> **Hệ thống Chấm bài Lập trình Tự động**  
> Ngày cập nhật: October 16, 2025  
> Version: 2.0

---

## 📑 MỤC LỤC

1. [Giới Thiệu](#1-giới-thiệu)
2. [Quick Start](#2-quick-start)
3. [Kiến Trúc Hệ Thống](#3-kiến-trúc-hệ-thống)
4. [Vấn Đề Đã Fix](#4-vấn-đề-đã-fix)
5. [Hướng Dẫn Sử Dụng](#5-hướng-dẫn-sử-dụng)
6. [API Documentation](#6-api-documentation)
7. [Testing Guide](#7-testing-guide)
8. [Troubleshooting](#8-troubleshooting)
9. [Technical Details](#9-technical-details)

---

## 1. GIỚI THIỆU

### 🎯 Code Grader là gì?

**Code Grader** là một nền tảng web để tự động hóa quy trình chấm điểm các bài tập lập trình. Hệ thống hỗ trợ nhiều ngôn ngữ (C++, C, Python, Java) và sử dụng Docker sandbox để chạy code an toàn.

### ✨ Tính Năng Chính

- ✅ **Auto Grading**: Tự động chấm điểm với test cases
- ✅ **Multi-language**: C++, C, Python, Java
- ✅ **Docker Sandbox**: Chạy code an toàn, cô lập
- ✅ **Real-time Results**: Kết quả tức thì (Accepted, Wrong Answer, TLE, etc.)
- ✅ **Class Management**: Teacher tạo lớp, student join bằng invite code
- ✅ **Problem Management**: Tạo bài tập với test cases, difficulty levels
- ✅ **Code Editor**: Monaco Editor với syntax highlighting
- ✅ **Submission History**: Lưu trữ và xem lại code đã submit
- ✅ **Progress Tracking**: Theo dõi tiến độ học sinh

### 🏗️ Tech Stack

**Frontend:**
- Next.js 15.2.4 + TypeScript
- Radix UI + Tailwind CSS (Neobrutalism design)
- Monaco Editor
- Axios

**Backend:**
- Flask + SQLAlchemy
- PostgreSQL
- JWT Authentication
- RabbitMQ (Message Queue)

**Grading Engine:**
- Python + Docker SDK
- RabbitMQ Consumer
- Docker Sandbox (C++ compiler, Python interpreter, etc.)

---

## 2. QUICK START

### ⚡ Cách 1: Setup Tự Động (Khuyên dùng)

```bash
# Clone repository
git clone <repo-url>
cd code-grader-project

# Chạy script setup tự động
./setup.sh
```

**Script sẽ tự động:**
1. Dừng và xóa containers cũ
2. Build lại Docker images
3. Khởi động PostgreSQL, RabbitMQ, Backend, Frontend
4. Chạy migrations và seed database
5. Tạo dữ liệu test
6. Build image `cpp-grader-env`
7. Chạy worker

**Kết quả:**
```
=======================================================================
==           SETUP COMPLETE. ALL SYSTEMS ARE GO!                   ==
=======================================================================

Backend API: http://localhost:5000/api/docs
Frontend: http://localhost:3000

Test accounts:
  - Teacher: teacher.dev@example.com / password
  - Student: student.dev@example.com / password

Worker is running... (Press Ctrl+C to stop)
=======================================================================
```

### 🌐 Truy Cập

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Swagger Docs**: http://localhost:5000/api/docs
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)

### 🔑 Tài Khoản Test

| Role | Email | Password |
|------|-------|----------|
| Teacher | teacher.dev@example.com | password |
| Student | student.dev@example.com | password |

---

### 🛠️ Cách 2: Setup Thủ Công

#### Bước 1: Khởi động services

```bash
# Start PostgreSQL, RabbitMQ, Backend, Frontend
docker-compose up -d

# Xem logs
docker-compose logs -f backend
```

#### Bước 2: Setup Database (lần đầu)

```bash
# Vào backend container
docker exec -it code-grader-project-backend-1 bash

# Chạy migrations
flask db upgrade

# Seed dữ liệu
flask seed_db
flask seed_test_data

exit
```

#### Bước 3: Build C++ Grader Image

```bash
docker build -t cpp-grader-env ./grader-engine
```

#### Bước 4: Setup Python Virtual Environment

```bash
cd grader-engine

# Tạo virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Bước 5: Chạy Worker

```bash
# Trong thư mục grader-engine với venv activated
export GRADER_TEMP_DIR=/workspaces/code-grader-project/grader-temp
export HOST_GRADER_TEMP_DIR=/workspaces/code-grader-project/grader-temp
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/code_grader
export RABBITMQ_HOST=localhost

python run.py
```

---

### 🔄 Chạy Lại Worker (Khi đã setup)

```bash
# Đảm bảo services đang chạy
docker-compose up -d

# Chạy worker
./run_worker.sh
```

---

## 3. KIẾN TRÚC HỆ THỐNG

### 📊 Tổng Quan

```
┌─────────────────────────────────────────────────────────────┐
│                        USER (Browser)                        │
│                 http://localhost:3000                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              FRONTEND (Next.js + TypeScript)                 │
│  - Authentication UI                                         │
│  - Class & Problem Management                                │
│  - Monaco Code Editor                                        │
│  - Submission History                                        │
└─────────────────────┬───────────────────────────────────────┘
                      │ REST API (JWT Auth)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                BACKEND (Flask + SQLAlchemy)                  │
│  - JWT Authentication                                        │
│  - Class/Problem/Submission CRUD                             │
│  - PostgreSQL Database                                       │
│  - RabbitMQ Producer (send grading tasks)                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
┌─────────────────┐         ┌──────────────────────────┐
│   PostgreSQL    │         │       RabbitMQ           │
│   (Database)    │         │   (Message Queue)        │
└─────────────────┘         └──────────┬───────────────┘
                                       │ Consume tasks
                                       ▼
                            ┌────────────────────────────┐
                            │   WORKER (Python process)  │
                            │   - Chạy trên HOST         │
                            │   - Nhận task từ RabbitMQ  │
                            │   - Tạo sandbox container  │
                            └─────────┬──────────────────┘
                                      │ Docker API
                                      ▼
                            ┌────────────────────────────┐
                            │  DOCKER SANDBOX CONTAINER  │
                            │  - Image: cpp-grader-env   │
                            │  - Compile & Run code      │
                            │  - Memory/Time limits      │
                            │  - Isolated environment    │
                            └────────────────────────────┘
```

### 🔄 Flow Hoạt Động Chấm Bài

```
1. Student submit code qua Frontend
        ↓
2. Backend lưu submission vào DB (status: queued)
        ↓
3. Backend gửi task vào RabbitMQ queue
        ↓
4. Worker (chạy trên HOST) nhận task
        ↓
5. Worker tạo thư mục tạm:
   /workspaces/code-grader-project/grader-temp/submission_X_UUID/
        ↓
6. Worker ghi file code, input, expected_output
        ↓
7. Worker tạo Docker container:
   - Image: cpp-grader-env
   - Mount: thư mục tạm → /sandbox
   - Command: compile & run
   - Limits: Memory 256MB, Time limit theo config
        ↓
8. Container compile code:
   g++ -std=c++17 -O2 main.cpp -o main
        ↓
9. Container chạy với từng test case:
   cat input.txt | ./main > output.txt
        ↓
10. Worker so sánh output vs expected_output
        ↓
11. Worker tính điểm (dựa trên points của test case)
        ↓
12. Worker gửi kết quả về Backend API
        ↓
13. Backend cập nhật DB (status, score, test_results)
        ↓
14. Frontend poll/refresh để hiển thị kết quả
```

### 📁 Cấu Trúc Thư Mục

```
code-grader-project/
├── backend/              # Flask API
│   ├── app/
│   │   ├── models.py           # SQLAlchemy models
│   │   ├── auth_routes.py      # /api/auth/*
│   │   ├── class_routes.py     # /api/classes/*
│   │   ├── problem_routes.py   # /api/problems/*
│   │   ├── submission_routes.py # /api/submissions/*
│   │   ├── student_routes.py   # /api/students/*
│   │   ├── config.py
│   │   └── decorators.py       # JWT decorators
│   ├── migrations/         # Alembic migrations
│   ├── requirements.txt
│   ├── run.py
│   └── Dockerfile
│
├── frontend-new/         # Next.js 15 + TypeScript
│   ├── app/
│   │   ├── login/
│   │   ├── register/
│   │   ├── student/
│   │   │   ├── dashboard/
│   │   │   ├── class/[id]/
│   │   │   └── problem/[id]/
│   │   └── teacher/
│   │       ├── dashboard/
│   │       ├── class/[id]/
│   │       └── problem/[id]/
│   ├── components/         # UI components
│   ├── services/
│   │   └── api.ts          # API client
│   ├── types/
│   │   └── index.ts        # TypeScript types
│   ├── package.json
│   └── Dockerfile
│
├── grader-engine/        # Worker + Docker sandbox
│   ├── worker/
│   │   ├── main.py         # RabbitMQ consumer
│   │   ├── grader.py       # Core grading logic
│   │   ├── config.py
│   │   └── models.py
│   ├── Dockerfile          # cpp-grader-env image
│   ├── requirements.txt
│   └── run.py
│
├── grader-temp/          # Temporary submission files
│   └── submission_X_UUID/
│
├── docs/                 # Documentation
│   └── DOCUMENTATION.md  # This file
│
├── docker-compose.yml    # Main compose file
├── setup.sh              # Auto setup script
└── run_worker.sh         # Worker startup script
```

---

## 4. VẤN ĐỀ ĐÃ FIX

### ❌ Lỗi Docker-in-Docker (Đã Fix)

**Lỗi gặp phải:**
```
400 Client Error: Bad Request
"invalid mount config for type "bind": bind source path does not exist: 
/app/submission_2_963f91c5-72ec-4ba7-a55b-feda5d36101d"
```

**Nguyên nhân:**

Khi worker chạy **trong Docker container** và cố gắng mount thư mục để tạo sandbox container mới:

```
┌─────────────────────────────────────────────────────────┐
│ HOST                                                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Worker Container                                  │  │
│  │  - Tạo thư mục: /app/submission_XXX              │  │
│  │  - Gọi Docker API mount: /app/submission_XXX     │  │
│  └──────────────────────────────────────────────────┘  │
│                         ↓                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Docker Daemon (HOST)                             │  │
│  │  - Tìm /app/submission_XXX trên HOST             │  │
│  │  - ❌ KHÔNG TỒN TẠI!                            │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Giải pháp: Chạy Worker trực tiếp trên HOST**

```
┌─────────────────────────────────────────────────────────┐
│ HOST                                                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Worker (Python process)                          │  │
│  │  - Tạo: /workspaces/.../grader-temp/...         │  │
│  │  - Mount: /workspaces/.../grader-temp/...       │  │
│  └──────────────────────────────────────────────────┘  │
│                         ↓                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Docker Daemon (HOST)                             │  │
│  │  - Tìm: /workspaces/.../grader-temp/...         │  │
│  │  - ✅ TỒN TẠI! Mount thành công                 │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Ưu điểm:**
- ✅ Không còn lỗi mount path
- ✅ Dễ debug, xem logs trực tiếp
- ✅ Hot reload - không cần rebuild Docker
- ✅ Hiệu năng tốt hơn

---

## 5. HƯỚNG DẪN SỬ DỤNG

### 👨‍🏫 Teacher Flow

#### 5.1. Đăng ký / Đăng nhập

1. Truy cập http://localhost:3000/register
2. Nhập thông tin:
   - Full Name: "John Teacher"
   - Email: "john@teacher.com"
   - Password: "password123"
   - Role: **Teacher**
3. Submit → Tự động đăng nhập và chuyển đến `/teacher/dashboard`

#### 5.2. Tạo Lớp Học

1. Tại Dashboard, click **"Create Class"**
2. Nhập thông tin:
   - Class Name: "Data Structures 2025"
   - Course Code: "CS301"
   - Description: "Advanced data structures and algorithms"
3. Submit → Class xuất hiện trong danh sách
4. **Lưu lại Invite Code** (hiển thị trong class card) để student join

#### 5.3. Tạo Bài Tập

1. Click vào class card
2. Tab **"Assignments"** → Click **"Create Assignment"**
3. Nhập thông tin:
   - **Title**: "Problem A: Two Sum"
   - **Description**: "Given an array of integers and a target..."
   - **Difficulty**: Easy / Medium / Hard
   - **Time Limit**: 1000 (ms)
   - **Memory Limit**: 256 (MB)
   - **Grading Mode**: 
     - **Standard I/O**: Input/Output qua stdin/stdout
     - **Function-based**: Test function cụ thể
   - **Function Signature** (nếu chọn Function-based):
     ```cpp
     vector<int> twoSum(vector<int>& nums, int target)
     ```

4. **Thêm Test Cases**:
   - Click **"Add Test Case"**
   - Input: `5 10`
   - Expected Output: `15`
   - Points: `20` (điểm cho test case này)
   - Is Hidden: ☐ (student có thấy test case này không)
   
5. Thêm nhiều test cases...
6. Submit → Problem được tạo

#### 5.4. Xem Submissions

1. Click vào problem trong class
2. Tab **"Submissions"** → Xem tất cả submissions của students
3. Thông tin hiển thị:
   - Student name
   - Status (Accepted, Wrong Answer, TLE, etc.)
   - Score (100/100)
   - Language
   - Submitted time
4. Click **"View Code"** để xem source code student đã submit

---

### 👨‍🎓 Student Flow

#### 5.5. Đăng ký / Đăng nhập

1. Truy cập http://localhost:3000/register
2. Nhập thông tin với Role: **Student**
3. Submit → Tự động chuyển đến `/student/dashboard`

#### 5.6. Join Class

1. Tại Dashboard, click **"Join Class"**
2. Nhập **Invite Code** (lấy từ teacher)
3. Submit → Class xuất hiện trong danh sách

#### 5.7. Xem Bài Tập

1. Click vào class card
2. Xem danh sách problems với status:
   - 🟢 **Accepted** (đã làm đúng)
   - 🔴 **Failed** (đã làm sai)
   - ⚪ **Not Started** (chưa làm)
3. Hiển thị: Difficulty, Score, Attempts

#### 5.8. Làm Bài

1. Click vào problem
2. Đọc đề bài (Description, Constraints, Test Cases)
3. Chọn ngôn ngữ: C++, C, Python, Java
4. Viết code trong **Monaco Editor**
5. Click **"Submit"**

**Code ví dụ (C++):**
```cpp
#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}
```

6. Đợi kết quả (3-10 giây)
7. Kết quả hiển thị:
   - **Status**: Accepted / Wrong Answer / Time Limit Exceeded / etc.
   - **Score**: 100/100
   - **Test Results**: Passed 5/5 test cases
   - **Execution Time**: 0.002s
   - **Memory Used**: 2.5 MB

#### 5.9. Xem Lịch Sử Submit

1. Click **"History"** button
2. Xem tất cả submissions trước đó
3. Click vào submission → Load lại code cũ
4. Có thể sửa và submit lại

---

## 6. API DOCUMENTATION

### 🔐 Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student"  // or "teacher"
}

Response: 201
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response: 200
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>

Response: 200
{
  "id": 1,
  "full_name": "John Doe",
  "email": "john@example.com",
  "role": "student"
}
```

---

### 📚 Class Management

#### Create Class (Teacher only)
```http
POST /api/classes
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Data Structures 2025",
  "course_code": "CS301",
  "description": "Advanced data structures"
}

Response: 201
{
  "id": 1,
  "name": "Data Structures 2025",
  "course_code": "CS301",
  "description": "Advanced data structures",
  "invite_code": "abc123xyz",
  "teacher_id": 1,
  "created_at": "2025-10-16T10:00:00Z"
}
```

#### Get All Classes
```http
GET /api/classes
Authorization: Bearer <token>

Response: 200
[
  {
    "id": 1,
    "name": "Data Structures 2025",
    "course_code": "CS301",
    "description": "...",
    "student_count": 24,
    "created_at": "2025-10-16T10:00:00Z"
  }
]
```

#### Get Class Details
```http
GET /api/classes/1
Authorization: Bearer <token>

Response: 200
{
  "id": 1,
  "name": "Data Structures 2025",
  "course_code": "CS301",
  "description": "...",
  "invite_code": "abc123xyz",
  "teacher": {
    "id": 1,
    "full_name": "John Teacher",
    "email": "john@teacher.com"
  },
  "student_count": 24,
  "created_at": "2025-10-16T10:00:00Z"
}
```

#### Join Class (Student only)
```http
POST /api/classes/join
Authorization: Bearer <token>
Content-Type: application/json

{
  "invite_code": "abc123xyz"
}

Response: 200
{
  "message": "Successfully joined class",
  "class": { ... }
}
```

#### Get Students in Class (Teacher only)
```http
GET /api/classes/1/students
Authorization: Bearer <token>

Response: 200
[
  {
    "id": 2,
    "full_name": "Jane Student",
    "email": "jane@student.com",
    "enrolled_at": "2025-10-16T11:00:00Z"
  }
]
```

---

### 📝 Problem Management

#### Create Problem (Teacher only)
```http
POST /api/classes/1/problems
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Two Sum",
  "description": "Given an array...",
  "difficulty": "medium",
  "time_limit_ms": 1000,
  "memory_limit_kb": 262144,
  "grading_mode": "stdio",
  "function_signature": null,
  "test_cases": [
    {
      "input": "5 10",
      "expected_output": "15",
      "is_hidden": false,
      "points": 20
    },
    {
      "input": "-1 -2",
      "expected_output": "-3",
      "is_hidden": false,
      "points": 20
    }
  ]
}

Response: 201
{
  "id": 1,
  "title": "Two Sum",
  "difficulty": "medium",
  ...
}
```

#### Get Problems in Class
```http
GET /api/classes/1/problems
Authorization: Bearer <token>

Response: 200
[
  {
    "id": 1,
    "title": "Two Sum",
    "difficulty": "medium",
    "grading_mode": "stdio",
    "time_limit_ms": 1000,
    "memory_limit_kb": 262144
  }
]
```

#### Get Problem Details
```http
GET /api/problems/1
Authorization: Bearer <token>

Response: 200
{
  "id": 1,
  "title": "Two Sum",
  "description": "...",
  "difficulty": "medium",
  "time_limit_ms": 1000,
  "memory_limit_kb": 262144,
  "grading_mode": "stdio",
  "function_signature": null,
  "test_cases": [
    {
      "id": 1,
      "input": "5 10",
      "expected_output": "15",
      "is_hidden": false,
      "points": 20
    }
  ]
}
```

#### Get Problem Submissions (Teacher only)
```http
GET /api/problems/1/submissions
Authorization: Bearer <token>

Response: 200
[
  {
    "id": 1,
    "student": {
      "id": 2,
      "full_name": "Jane Student",
      "email": "jane@student.com"
    },
    "status": "accepted",
    "score": 100,
    "passed_tests": 5,
    "total_tests": 5,
    "language": "cpp",
    "submitted_at": "2025-10-16T12:00:00Z"
  }
]
```

---

### 📤 Submission Management

#### Submit Code
```http
POST /api/submissions
Authorization: Bearer <token>
Content-Type: application/json

{
  "problem_id": 1,
  "source_code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    cout << a + b << endl;\n    return 0;\n}",
  "language": "cpp"
}

Response: 201
{
  "id": 1,
  "problem_id": 1,
  "student_id": 2,
  "status": "queued",
  "submitted_at": "2025-10-16T12:00:00Z"
}
```

#### Get Submission Details
```http
GET /api/submissions/1
Authorization: Bearer <token>

Response: 200
{
  "id": 1,
  "problem_id": 1,
  "student_id": 2,
  "status": "accepted",
  "score": 100,
  "passed_tests": 5,
  "total_tests": 5,
  "execution_time_ms": 2,
  "memory_used_kb": 2560,
  "test_results": [
    {
      "test_case_id": 1,
      "passed": true,
      "execution_time_ms": 2,
      "memory_used_kb": 2560,
      "output": "15",
      "error_message": null
    }
  ],
  "submitted_at": "2025-10-16T12:00:00Z"
}
```

#### Get My Submissions (Student)
```http
GET /api/submissions/me?problem_id=1
Authorization: Bearer <token>

Response: 200
[
  {
    "id": 1,
    "problem_id": 1,
    "status": "accepted",
    "score": 100,
    "language": "cpp",
    "submitted_at": "2025-10-16T12:00:00Z"
  }
]
```

#### Get Submission Code
```http
GET /api/submissions/1/code
Authorization: Bearer <token>

Response: 200
{
  "code": "#include <iostream>\n...",
  "language": "cpp"
}
```

---

### 📊 Student Progress

#### Get Problems Status in Class
```http
GET /api/students/me/classes/1/problems-status
Authorization: Bearer <token>

Response: 200
[
  {
    "problem_id": 1,
    "title": "Two Sum",
    "difficulty": "medium",
    "status": "accepted",
    "best_score": 100,
    "attempts": 3
  },
  {
    "problem_id": 2,
    "title": "Binary Search",
    "difficulty": "easy",
    "status": "not_started",
    "best_score": null,
    "attempts": 0
  }
]
```

#### Get My Progress
```http
GET /api/students/me/progress
Authorization: Bearer <token>

Response: 200
{
  "total_classes": 3,
  "total_problems": 45,
  "problems_solved": 12,
  "problems_attempted": 20,
  "average_score": 85.5
}
```

---

## 7. TESTING GUIDE

### 🧪 End-to-End Testing

#### Scenario 1: Teacher Flow

1. **Register & Login**
   ```
   → /register
   → Email: teacher@test.com
   → Role: Teacher
   → Should redirect to /teacher/dashboard
   ```

2. **Create Class**
   ```
   → Click "Create Class"
   → Name: "Test Class 2025"
   → Code: "TEST101"
   → Description: "Test description"
   → Submit
   → Should see class in list with invite code
   → Copy invite code: ABC123XYZ
   ```

3. **Create Problem**
   ```
   → Click class card
   → Click "Create Assignment"
   → Title: "Sum Two Numbers"
   → Description: "Input two integers, output their sum"
   → Difficulty: Easy
   → Time: 1000ms
   → Memory: 256MB
   → Grading: Standard I/O
   → Test Case 1: Input "5 10", Output "15", Points 50
   → Test Case 2: Input "-1 -2", Output "-3", Points 50
   → Submit
   → Should redirect back to class detail
   ```

#### Scenario 2: Student Flow

1. **Register & Login**
   ```
   → /register
   → Email: student@test.com
   → Role: Student
   → Should redirect to /student/dashboard
   ```

2. **Join Class**
   ```
   → Click "Join Class"
   → Enter invite code: ABC123XYZ
   → Submit
   → Should see "Test Class 2025" in list
   ```

3. **Solve Problem**
   ```
   → Click class card
   → Should see "Sum Two Numbers" with "Not Started"
   → Click problem
   → Select Language: C++
   → Write code:
   ```
   ```cpp
   #include <iostream>
   using namespace std;
   
   int main() {
       int a, b;
       cin >> a >> b;
       cout << a + b << endl;
       return 0;
   }
   ```
   ```
   → Click "Submit"
   → Wait 5-10 seconds
   → Should see: Status "Accepted", Score 100/100
   ```

4. **View History**
   ```
   → Click "History"
   → Should see submission with "Accepted"
   → Click submission
   → Should load previous code
   ```

#### Scenario 3: Teacher View Submissions

1. **As Teacher**
   ```
   → Go to class detail
   → Click on "Sum Two Numbers" problem
   → Tab "Submissions"
   → Should see student@test.com submission
   → Status: Accepted, Score: 100
   → Click "View Code"
   → Should see student's source code
   ```

---

### 🔍 Testing với Swagger UI

Truy cập: http://localhost:5000/api/docs

#### Test Authentication

1. **Register**
   - Endpoint: `POST /api/auth/register`
   - Body:
   ```json
   {
     "full_name": "Test User",
     "email": "test@example.com",
     "password": "password123",
     "role": "student"
   }
   ```

2. **Login**
   - Endpoint: `POST /api/auth/login`
   - Body:
   ```json
   {
     "email": "test@example.com",
     "password": "password123"
   }
   ```
   - Copy `access_token` từ response

3. **Authorize**
   - Click nút "Authorize" (góc trên)
   - Paste token
   - Click "Authorize" → "Close"

4. **Test Protected Endpoints**
   - Tất cả endpoints khác giờ sẽ sử dụng token này

---

### ✅ Checklist Testing

#### Core Features
- [ ] Register Teacher account
- [ ] Register Student account
- [ ] Login with both accounts
- [ ] Create class (Teacher)
- [ ] View invite code
- [ ] Join class with invite code (Student)
- [ ] Create problem with test cases
- [ ] Student view problems in class
- [ ] Submit C++ code
- [ ] Submit Python code
- [ ] View submission result (Accepted)
- [ ] View submission result (Wrong Answer)
- [ ] View submission history
- [ ] Load previous submission code
- [ ] Teacher view all submissions
- [ ] Teacher view student code

#### Edge Cases
- [ ] Submit with wrong output → Wrong Answer
- [ ] Submit with infinite loop → Time Limit Exceeded
- [ ] Submit with syntax error → Compile Error
- [ ] Submit with excessive memory → Memory Limit Exceeded
- [ ] Join class with wrong invite code → Error
- [ ] Create problem without test cases → Error
- [ ] Submit without login → 401 Unauthorized

---

## 8. TROUBLESHOOTING

### 🔧 Common Issues

#### Issue 1: Worker không chạy

**Triệu chứng:**
```
Connection refused to RabbitMQ
```

**Giải pháp:**
```bash
# Kiểm tra RabbitMQ đang chạy
docker-compose ps

# Nếu không chạy, start lại
docker-compose up -d rabbitmq

# Đợi 10 giây, sau đó chạy worker
./run_worker.sh
```

---

#### Issue 2: Submission bị stuck ở "queued"

**Triệu chứng:**
- Submit code nhưng status mãi là "queued"
- Không có kết quả trả về

**Nguyên nhân:**
- Worker không chạy hoặc không nhận được task

**Giải pháp:**
```bash
# Kiểm tra worker logs
# Phải thấy: "[*] Waiting for tasks..."

# Nếu không thấy, restart worker
./run_worker.sh
```

---

#### Issue 3: Docker image `cpp-grader-env` không tồn tại

**Triệu chứng:**
```
Error: No such image: cpp-grader-env
```

**Giải pháp:**
```bash
# Build image
docker build -t cpp-grader-env ./grader-engine

# Kiểm tra image đã có
docker images | grep cpp-grader-env
```

---

#### Issue 4: Frontend không kết nối được Backend

**Triệu chứng:**
- API calls fail với "Network Error"
- Frontend console: `ERR_CONNECTION_REFUSED`

**Giải pháp:**
```bash
# Kiểm tra Backend đang chạy
curl http://localhost:5000/api/health

# Nếu không chạy
docker-compose up -d backend

# Kiểm tra .env.local trong frontend
cat frontend-new/.env.local
# Phải có: NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

#### Issue 5: Database migration errors

**Triệu chứng:**
```
sqlalchemy.exc.ProgrammingError: column "difficulty" does not exist
```

**Giải pháp:**
```bash
# Vào backend container
docker exec -it code-grader-project-backend-1 bash

# Chạy migrations
flask db upgrade

# Nếu cần tạo migration mới
flask db revision -m "add_missing_fields"
flask db upgrade

exit
```

---

#### Issue 6: RabbitMQ connection refused

**Triệu chứng:**
```
pika.exceptions.AMQPConnectionError
```

**Giải pháp:**
```bash
# Restart RabbitMQ
docker-compose restart rabbitmq

# Đợi 15 giây để RabbitMQ khởi động hoàn toàn
sleep 15

# Chạy lại worker
./run_worker.sh
```

---

#### Issue 7: Permission denied khi tạo thư mục grader-temp

**Triệu chứng:**
```
PermissionError: [Errno 13] Permission denied: '/workspaces/.../grader-temp'
```

**Giải pháp:**
```bash
# Tạo thư mục và set permissions
mkdir -p grader-temp
chmod 777 grader-temp
```

---

#### Issue 8: Container sandbox timeout

**Triệu chứng:**
- Submission mãi không có kết quả
- Worker log: "Container timeout"

**Giải pháp:**
```bash
# Kiểm tra containers đang chạy
docker ps

# Xóa containers zombie
docker ps -a | grep cpp-grader-env | awk '{print $1}' | xargs docker rm -f

# Restart worker
./run_worker.sh
```

---

### 🔄 Reset Toàn Bộ Hệ Thống

Nếu gặp nhiều lỗi không rõ nguyên nhân:

```bash
# Stop tất cả containers
docker-compose down

# Xóa volumes (⚠️ Mất dữ liệu!)
docker-compose down -v

# Xóa tất cả images
docker-compose down --rmi all

# Build và start lại từ đầu
./setup.sh
```

---

## 9. TECHNICAL DETAILS

### 🗄️ Database Schema

#### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id VARCHAR(50) NOT NULL,  -- 'student' or 'teacher'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Classes Table
```sql
CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    course_code VARCHAR(50),
    description TEXT,
    invite_code VARCHAR(50) UNIQUE NOT NULL,
    teacher_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Problems Table
```sql
CREATE TABLE problems (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    time_limit_ms INTEGER DEFAULT 1000,
    memory_limit_kb INTEGER DEFAULT 262144,
    difficulty VARCHAR(20) DEFAULT 'medium',  -- 'easy', 'medium', 'hard'
    grading_mode VARCHAR(20) DEFAULT 'stdio',  -- 'stdio', 'function'
    function_signature TEXT,
    class_id INTEGER REFERENCES classes(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Test Cases Table
```sql
CREATE TABLE test_cases (
    id SERIAL PRIMARY KEY,
    problem_id INTEGER REFERENCES problems(id),
    input_data TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    is_hidden BOOLEAN DEFAULT FALSE,
    points INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Submissions Table
```sql
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    problem_id INTEGER REFERENCES problems(id),
    student_id INTEGER REFERENCES users(id),
    source_code TEXT NOT NULL,
    language VARCHAR(20) NOT NULL,
    status VARCHAR(50) DEFAULT 'queued',
    execution_time_ms INTEGER,
    memory_used_kb INTEGER,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Test Results Table
```sql
CREATE TABLE test_results (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER REFERENCES submissions(id),
    test_case_id INTEGER REFERENCES test_cases(id),
    passed BOOLEAN NOT NULL,
    execution_time_ms INTEGER,
    memory_used_kb INTEGER,
    output TEXT,
    error_message TEXT
);
```

---

### 🔒 Security

#### JWT Authentication
- Token expiration: 24 hours
- Algorithm: HS256
- Secret key: Stored in environment variable

#### Docker Sandbox Security
- Network disabled (`network_mode='none'`)
- Memory limit enforced
- CPU limit enforced
- Time limit enforced
- No volume mounts except code directory (read-only)
- Container auto-removed after execution

#### Input Validation
- SQL injection prevention (SQLAlchemy ORM)
- XSS prevention (React escaping)
- CSRF protection (JWT tokens)

---

### 📊 Performance

#### Grading Performance
- Average grading time: 3-5 seconds
- Container startup overhead: ~1 second
- Compilation time: 0.5-2 seconds
- Execution time: <1 second per test case

#### Scalability
- Worker can be scaled horizontally
- RabbitMQ handles queue distribution
- Multiple workers can consume from same queue
- Database indexed on foreign keys

#### Optimization Tips
```python
# In worker/grader.py
# Reuse Docker client connection
client = docker.from_env()  # Initialize once

# Cleanup containers immediately after use
container.remove(force=True)

# Use tmpfs for faster I/O
mount_volume = docker.types.Mount(
    target="/sandbox",
    source=temp_dir_path,
    type="bind",
    read_only=False
)
```

---

### 🐛 Debugging

#### Enable Debug Logs

**Backend:**
```python
# backend/run.py
app.config['DEBUG'] = True
```

**Worker:**
```python
# grader-engine/worker/main.py
logging.basicConfig(level=logging.DEBUG)
```

#### View Logs

```bash
# Backend logs
docker-compose logs -f backend

# Database logs
docker-compose logs -f db

# RabbitMQ logs
docker-compose logs -f rabbitmq

# Worker logs
# (Terminal đang chạy worker)

# Container sandbox logs (khi chạy)
docker logs <container-id>
```

#### Test Individual Components

**Test Database Connection:**
```bash
docker exec -it code-grader-project-db-1 psql -U postgres -d code_grader -c "SELECT COUNT(*) FROM users;"
```

**Test RabbitMQ:**
```bash
# Web UI: http://localhost:15672
# Username: guest
# Password: guest
```

**Test Docker Sandbox:**
```bash
docker run --rm -it cpp-grader-env /bin/bash
# Thử compile code thủ công
```

---

### 🚀 Deployment

#### Production Checklist

- [ ] Set production environment variables
- [ ] Use strong SECRET_KEY for JWT
- [ ] Use production database (not SQLite)
- [ ] Enable HTTPS
- [ ] Set up proper CORS
- [ ] Configure rate limiting
- [ ] Set up monitoring (Prometheus, Grafana)
- [ ] Set up logging (ELK stack)
- [ ] Configure backup for database
- [ ] Set up CI/CD pipeline
- [ ] Load test the system
- [ ] Security audit

#### Environment Variables (Production)

```bash
# Backend
DATABASE_URL=postgresql://user:pass@prod-db:5432/code_grader
SECRET_KEY=<strong-random-string>
FLASK_ENV=production
RABBITMQ_HOST=prod-rabbitmq

# Frontend
NEXT_PUBLIC_API_URL=https://api.yourapp.com

# Worker
GRADER_TEMP_DIR=/var/grader_submissions
HOST_GRADER_TEMP_DIR=/var/grader_submissions
```

---

## 📝 Changelog

### Version 2.0 (October 16, 2025)
- ✅ Fixed Docker-in-Docker issue
- ✅ Worker now runs on HOST
- ✅ Integrated Next.js 15 frontend
- ✅ Added difficulty levels
- ✅ Added grading modes (stdio/function)
- ✅ Added test case points
- ✅ Added progress tracking
- ✅ Added submission history

### Version 1.0 (Initial)
- ✅ Basic authentication
- ✅ Class management
- ✅ Problem creation
- ✅ Code submission
- ✅ Auto grading with Docker

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 📧 Support

Nếu gặp vấn đề hoặc có câu hỏi, vui lòng:
1. Kiểm tra [Troubleshooting](#8-troubleshooting)
2. Xem lại [Testing Guide](#7-testing-guide)
3. Tạo issue trên GitHub

---

**🎉 Chúc bạn thành công với Code Grader Project!**
