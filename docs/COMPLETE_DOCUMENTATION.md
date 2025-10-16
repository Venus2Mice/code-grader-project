# 📚 CODE GRADER PROJECT - TÀI LIỆU TỔNG HỢP

> **Hệ thống chấm bài lập trình tự động với Docker Sandbox**  
> Ngày cập nhật: 16/10/2025

---

## 📋 MỤC LỤC

1. [Quick Start - Bắt Đầu Nhanh](#1-quick-start---bắt-đầu-nhanh)
2. [Tổng Quan Dự Án](#2-tổng-quan-dự-án)
3. [Kiến Trúc Hệ Thống](#3-kiến-trúc-hệ-thống)
4. [Vấn Đề Đã Fix - Docker-in-Docker](#4-vấn-đề-đã-fix---docker-in-docker)
5. [Hướng Dẫn Setup Chi Tiết](#5-hướng-dẫn-setup-chi-tiết)
6. [Testing Guide](#6-testing-guide)
7. [Tình Trạng Integration](#7-tình-trạng-integration)
8. [Troubleshooting](#8-troubleshooting)
9. [API Documentation](#9-api-documentation)

---

## 1. QUICK START - BẮT ĐẦU NHANH

### ⚡ Chạy Tự Động (Khuyên Dùng)

```bash
# Từ thư mục gốc dự án
./setup.sh
```

Script sẽ tự động:
- ✅ Dừng và xóa tất cả containers cũ
- ✅ Build lại Docker images
- ✅ Khởi động PostgreSQL, RabbitMQ, Backend, Frontend
- ✅ Chạy migrations và seed database
- ✅ Tạo tài khoản test
- ✅ Build image `cpp-grader-env`
- ✅ Chạy worker

### 🌐 Truy Cập Hệ Thống

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Swagger Docs**: http://localhost:5000/api/docs
- **RabbitMQ**: http://localhost:15672 (guest/guest)

### 👥 Tài Khoản Test

```
Teacher: teacher.dev@example.com / password
Student: student.dev@example.com / password
```

### 🔄 Chạy Lại Worker (Nếu Cần)

```bash
# Đảm bảo services đang chạy
docker-compose up -d

# Chạy worker
./run_worker.sh
```

---

## 2. TỔNG QUAN DỰ ÁN

### ✨ Tính Năng Chính

#### Cho Giáo Viên:
- ✅ Tạo và quản lý lớp học
- ✅ Tạo bài tập với test cases
- ✅ Cấu hình độ khó (Easy/Medium/Hard)
- ✅ Chế độ chấm điểm: Standard I/O hoặc Function-based
- ✅ Xem tất cả submissions của học sinh
- ✅ Theo dõi tiến độ từng học sinh

#### Cho Học Sinh:
- ✅ Join lớp bằng invite code
- ✅ Xem danh sách bài tập
- ✅ Code editor với syntax highlighting (Monaco Editor)
- ✅ Submit code (C++, C, Python, Java)
- ✅ Xem kết quả chấm tự động tức thì
- ✅ Lịch sử submissions với load lại code cũ

#### Hệ Thống Grading:
- ✅ Tự động compile và run code
- ✅ Docker sandbox an toàn (isolation)
- ✅ Time limit và Memory limit
- ✅ Multiple test cases với điểm số riêng
- ✅ Kết quả chi tiết: Accepted, Wrong Answer, TLE, MLE, Runtime Error, Compile Error
- ✅ Queue-based processing với RabbitMQ

### 🏗️ Stack Công Nghệ

```
Frontend:  Next.js 15 + TypeScript + Tailwind CSS + Monaco Editor
Backend:   Flask + SQLAlchemy + PostgreSQL + JWT
Queue:     RabbitMQ
Grading:   Python Worker + Docker Containers (C++ sandbox)
```

### 📁 Cấu Trúc Dự Án

```
code-grader-project/
├── backend/              # Flask API
│   ├── app/
│   │   ├── models.py           # Database models
│   │   ├── auth_routes.py      # Authentication
│   │   ├── class_routes.py     # Class management
│   │   ├── problem_routes.py   # Problem management
│   │   ├── submission_routes.py
│   │   ├── student_routes.py
│   │   └── rabbitmq_producer.py
│   └── migrations/
├── frontend-new/         # Next.js frontend
│   ├── app/             # Pages (App Router)
│   ├── components/      # Reusable UI components
│   ├── services/        # API service layer
│   └── types/           # TypeScript types
├── grader-engine/        # Worker + Docker sandbox
│   ├── worker/
│   │   ├── grader.py   # Main grading logic
│   │   └── main.py     # RabbitMQ consumer
│   └── Dockerfile      # C++ sandbox image
├── grader-temp/          # Tạm thời (auto-generated)
├── scripts/
│   ├── setup.sh
│   └── run_worker.sh
└── docker-compose.yml
```

---

## 3. KIẾN TRÚC HỆ THỐNG

### 🔄 Flow Hoạt Động

```
┌──────────────┐
│   Frontend   │  React: Submit code C++
│  (Next.js)   │
└──────┬───────┘
       │ HTTP POST /api/submissions
       ▼
┌──────────────┐
│   Backend    │  Flask: Lưu DB, publish task to queue
│   (Flask)    │
└──────┬───────┘
       │ AMQP
       ▼
┌──────────────┐
│  RabbitMQ    │  Message Queue
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    Worker    │  Python: Nhận task
│  (Python)    │  - Tạo thư mục tạm
│              │  - Tạo Docker container
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────┐
│        Docker Sandbox Container          │
│  Image: cpp-grader-env                   │
│  Mount: grader-temp/submission_X/ → /sandbox │
│                                          │
│  1. Compile: g++ -std=c++17 main.cpp    │
│  2. Run: cat input.txt | ./main         │
│  3. Giới hạn: Memory 256MB, Time limit │
└──────┬───────────────────────────────────┘
       │ Return: exit code, stdout, stderr
       ▼
┌──────────────┐
│    Worker    │  So sánh output với expected
│              │  Tính điểm, POST kết quả về Backend
└──────┬───────┘
       │ HTTP PUT /api/submissions/<id>
       ▼
┌──────────────┐
│   Backend    │  Update database
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Frontend   │  Hiển thị kết quả cho user
└──────────────┘
```

### 🗄️ Database Schema

#### Users
```sql
id, full_name, email, password_hash, role_id (student/teacher), created_at
```

#### Classes
```sql
id, name, course_code, description, invite_code, teacher_id, created_at
```

#### Problems
```sql
id, title, description, class_id
time_limit_ms, memory_limit_kb, due_date
difficulty (easy/medium/hard)
grading_mode (stdio/function)
function_signature
created_at
```

#### TestCases
```sql
id, problem_id, input_data, expected_output
is_hidden, points, order_index
```

#### Submissions
```sql
id, problem_id, student_id, source_code
language, status, submitted_at
execution_time_ms, memory_used_kb
```

#### SubmissionResults
```sql
id, submission_id, test_case_id
status (passed/failed/error)
actual_output, error_message
execution_time_ms, memory_used_kb
```

---

## 4. VẤN ĐỀ ĐÃ FIX - DOCKER-IN-DOCKER

### ❌ Lỗi Gặp Phải

```
An error occurred during grading submission 2: 400 Client Error for 
http+docker://localhost/v1.51/containers/create: Bad Request 
("invalid mount config for type "bind": bind source path does not exist: 
/app/submission_2_963f91c5-72ec-4ba7-a55b-feda5d36101d")
```

### 🔍 Nguyên Nhân

**Vấn đề Docker-in-Docker:**

Khi worker chạy **bên trong Docker container** và sử dụng Docker socket để tạo container mới:

```
┌─────────────────────────────────────────────────────────┐
│ HOST (Máy thực)                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Worker Container                                  │  │
│  │  - Tạo thư mục: /app/submission_XXX              │  │
│  │  - Gọi Docker API để tạo sandbox container       │  │
│  │  - Yêu cầu mount: /app/submission_XXX            │  │
│  └──────────────────────────────────────────────────┘  │
│                         ↓                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Docker Daemon (chạy trên HOST)                   │  │
│  │  - Tìm đường dẫn /app/submission_XXX trên HOST   │  │
│  │  - ❌ KHÔNG TỒN TẠI! (chỉ có trong container)   │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Vấn đề cốt lõi:**
- Worker tạo thư mục trong **container** tại `/app/submission_XXX`
- Docker daemon chạy trên **HOST**, tìm đường dẫn trên **HOST**
- Đường dẫn `/app/submission_XXX` không tồn tại trên HOST
- → Lỗi mount!

### ✅ Giải Pháp

**Chạy Worker trực tiếp trên HOST (không dùng Docker container):**

```
┌─────────────────────────────────────────────────────────┐
│ HOST (Máy thực)                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Worker (Python process - chạy trực tiếp)         │  │
│  │  - Tạo thư mục: /workspaces/.../grader-temp/... │  │
│  │  - Gọi Docker API                                │  │
│  │  - Mount: /workspaces/.../grader-temp/...       │  │
│  └──────────────────────────────────────────────────┘  │
│                         ↓                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Docker Daemon (chạy trên HOST)                   │  │
│  │  - Tìm: /workspaces/.../grader-temp/...         │  │
│  │  - ✅ TỒN TẠI! Mount thành công                 │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Ưu điểm:**
- ✅ Không còn lỗi mount path
- ✅ Worker và Docker daemon cùng "nhìn thấy" thư mục
- ✅ Dễ debug, xem logs trực tiếp
- ✅ Hot reload - sửa code không cần rebuild Docker
- ✅ Hiệu năng tốt hơn (ít layer Docker)

### 📝 Thay Đổi Kỹ Thuật

#### File: `run_worker.sh`
```bash
export GRADER_TEMP_DIR=/workspaces/code-grader-project/grader-temp
export HOST_GRADER_TEMP_DIR=/workspaces/code-grader-project/grader-temp
# ✅ Cả 2 đường dẫn giống nhau vì worker chạy trên HOST

cd grader-engine
source venv/bin/activate
python run.py  # Chạy worker trực tiếp
```

#### File: `grader-engine/worker/config.py`
```python
class Config:
    GRADER_TEMP_DIR = os.environ.get('GRADER_TEMP_DIR', '/tmp/grader_submissions')
    HOST_GRADER_TEMP_DIR = os.environ.get('HOST_GRADER_TEMP_DIR', GRADER_TEMP_DIR)
```

#### File: `grader-engine/worker/grader.py`
```python
# Tạo thư mục trong GRADER_TEMP_DIR
temp_dir_path = os.path.join(Config.GRADER_TEMP_DIR, temp_dir_name)
os.makedirs(temp_dir_path, exist_ok=True)

# Mount sử dụng HOST_GRADER_TEMP_DIR
host_temp_dir_path = os.path.join(Config.HOST_GRADER_TEMP_DIR, temp_dir_name)
mount_volume = docker.types.Mount(
    target="/sandbox",
    source=host_temp_dir_path,  # ✅ Đường dẫn thực tế trên HOST
    type="bind"
)
```

---

## 5. HƯỚNG DẪN SETUP CHI TIẾT

### 🚀 Setup Tự Động (Recommended)

```bash
# Chạy script setup tự động
./setup.sh
```

Script sẽ tự động:
1. ✅ Dừng và xóa tất cả containers cũ
2. ✅ Build lại tất cả Docker images
3. ✅ Khởi động PostgreSQL, RabbitMQ, Backend, Frontend
4. ✅ Chạy migrations và seed database
5. ✅ Tạo dữ liệu test (teacher, student, classes, problems)
6. ✅ Build image `cpp-grader-env`
7. ✅ Tạo Python virtual environment
8. ✅ Chạy worker trong terminal hiện tại

### 🛠️ Setup Thủ Công (Advanced)

#### Bước 1: Khởi động các services

```bash
# Khởi động PostgreSQL, RabbitMQ, Backend, Frontend
docker-compose up -d

# Xem logs nếu cần
docker-compose logs -f backend
```

#### Bước 2: Setup Database (chỉ lần đầu)

```bash
# Vào backend container
docker exec -it code-grader-project-backend-1 bash

# Chạy migrations
flask db upgrade

# Seed dữ liệu
flask seed_db
flask seed_test_data

# Thoát
exit
```

#### Bước 3: Build image cho C++ grader

```bash
docker build -t cpp-grader-env ./grader-engine
```

#### Bước 4: Setup Python virtual environment

```bash
cd grader-engine

# Tạo virtual environment
python3 -m venv venv

# Kích hoạt
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Bước 5: Chạy worker

```bash
# Set environment variables
export GRADER_TEMP_DIR=/workspaces/code-grader-project/grader-temp
export HOST_GRADER_TEMP_DIR=/workspaces/code-grader-project/grader-temp
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/code_grader
export RABBITMQ_HOST=localhost
export BACKEND_API_URL=http://localhost:5000

# Chạy worker
cd grader-engine
source venv/bin/activate
python run.py
```

### 🎯 Các Môi Trường Setup

#### 1️⃣ Local Development (Khuyên dùng)
```bash
./setup-env.sh local

# Terminal 1: Backend services
docker-compose up -d postgres rabbitmq backend

# Terminal 2: Frontend
cd frontend-new
pnpm install
pnpm dev

# Terminal 3: Worker
./run_worker.sh
```

#### 2️⃣ Docker Compose (Tất cả trong containers)
```bash
./setup-env.sh docker
docker-compose -f docker-compose.dev.yml up -d
./run_worker.sh  # Worker vẫn chạy ngoài
```

#### 3️⃣ GitHub Codespaces
```bash
./setup-env.sh codespaces
docker-compose up -d backend postgres rabbitmq
cd frontend-new && pnpm install && pnpm dev
# Worker: terminal riêng với ./run_worker.sh
```

---

## 6. TESTING GUIDE

### 🧪 Test End-to-End với Swagger UI

**Truy cập:** http://localhost:5000/api/docs

#### Bước 1: Login

1. Mở endpoint `POST /api/auth/login`
2. Nhấn "Try it out"
3. Nhập:
   ```json
   {
     "email": "teacher.dev@example.com",
     "password": "password"
   }
   ```
4. Copy `access_token` từ response
5. Nhấn nút "Authorize" ở góc trên
6. Paste token vào và nhấn "Authorize"

#### Bước 2: Teacher Flow

**2.1. Tạo Class**
```
POST /api/classes
{
  "name": "Nhập môn Lập trình C++ 2025",
  "course_code": "CS101",
  "description": "Lớp học C++ cơ bản"
}
```
→ Ghi lại `id` và `invite_code`

**2.2. Tạo Problem**
```
POST /api/classes/{class_id}/problems
{
  "title": "Problem A: Tổng hai số",
  "description": "Nhập vào 2 số nguyên a, b. In ra tổng của chúng.",
  "difficulty": "easy",
  "grading_mode": "stdio",
  "time_limit_ms": 1000,
  "memory_limit_kb": 256000,
  "test_cases": [
    { "input": "5 10", "output": "15", "points": 50 },
    { "input": "-1 -2", "output": "-3", "points": 50 }
  ]
}
```
→ Ghi lại `id` của problem

#### Bước 3: Student Flow

**3.1. Đăng xuất Teacher, đăng nhập Student**
```
POST /api/auth/login
{
  "email": "student.dev@example.com",
  "password": "password"
}
```
→ Authorize lại với token mới

**3.2. Join Class**
```
POST /api/classes/join
{
  "invite_code": "abc123"  # Từ bước 2.1
}
```

**3.3. Submit Code**
```
POST /api/submissions
{
  "problem_id": 1,
  "source_code": "#include<iostream>\nusing namespace std;\nint main(){int a,b;cin>>a>>b;cout<<a+b;return 0;}",
  "language": "cpp"
}
```
→ Ghi lại `id` của submission

**3.4. Kiểm tra kết quả**
```
GET /api/submissions/{submission_id}
```

Phải thấy:
- `status`: "accepted"
- `score`: 100 (nếu pass hết test cases)
- `passed_tests`: 2
- `total_tests`: 2

### 🎭 Test Frontend

#### Test Teacher Flow:
1. Vào http://localhost:3000
2. Login với teacher account
3. Tạo class mới
4. Click vào class → Tab "Assignments"
5. Click "Create Assignment"
6. Điền thông tin problem, thêm test cases
7. Submit

#### Test Student Flow:
1. Logout và login với student account
2. Click "Join Class" → nhập invite code
3. Click vào class
4. Click vào problem
5. Viết code C++ trong editor
6. Submit
7. Đợi kết quả (5-10 giây)
8. Xem "History" tab để thấy submissions

### ✅ Expected Results

**Accepted submission:**
```json
{
  "status": "accepted",
  "score": 100,
  "passed_tests": 2,
  "total_tests": 2,
  "execution_time_ms": 150,
  "memory_used_kb": 2048
}
```

**Wrong Answer:**
```json
{
  "status": "wrong_answer",
  "score": 50,
  "passed_tests": 1,
  "total_tests": 2
}
```

**Compile Error:**
```json
{
  "status": "compile_error",
  "score": 0,
  "error_message": "main.cpp:2:1: error: expected ';'"
}
```

---

## 7. TÌNH TRẠNG INTEGRATION

### ✅ Đã Hoàn Thành (100%)

#### Database Models ✅
- **Class**: Added `description` field
- **Problem**: Added `difficulty`, `grading_mode`, `function_signature`
- **TestCase**: Added `points` field
- **Migrations**: File migration đã tạo tại `backend/migrations/versions/d6ce8b6308d1_add_frontend_required_fields.py`

#### Backend APIs ✅ (21/21 endpoints)

**Auth Routes:**
- `POST /api/auth/register` ✅
- `POST /api/auth/login` ✅
- `GET /api/auth/profile` ✅

**Class Routes:**
- `POST /api/classes` ✅
- `GET /api/classes` ✅
- `GET /api/classes/<id>` ✅
- `GET /api/classes/<id>/students` ✅
- `PUT /api/classes/<id>` ✅
- `DELETE /api/classes/<id>` ✅
- `POST /api/classes/join` ✅

**Problem Routes:**
- `POST /api/classes/<id>/problems` ✅
- `GET /api/classes/<id>/problems` ✅
- `GET /api/problems/<id>` ✅
- `GET /api/problems/<id>/submissions` ✅

**Submission Routes:**
- `POST /api/submissions` ✅
- `GET /api/submissions/<id>` ✅
- `GET /api/submissions/<id>/code` ✅

**Student Routes:**
- `GET /api/students/me/submissions` ✅
- `GET /api/students/me/classes/<id>/problems-status` ✅
- `GET /api/students/me/progress` ✅

#### Frontend Integration ✅ (9/9 pages)

**Pages hoàn chỉnh:**
1. ✅ Login Page - `app/login/page.tsx`
2. ✅ Register Page - `app/register/page.tsx`
3. ✅ Student Dashboard - `app/student/dashboard/page.tsx`
4. ✅ Teacher Dashboard - `app/teacher/dashboard/page.tsx`
5. ✅ Student Class Detail - `app/student/class/[id]/page.tsx`
6. ✅ Teacher Class Detail - `app/teacher/class/[id]/page.tsx`
7. ✅ Create Problem - `app/teacher/class/[id]/create-problem/page.tsx`
8. ✅ Student Problem Solve - `app/student/problem/[id]/page.tsx`
9. ✅ Teacher Problem Detail - `app/teacher/problem/[id]/page.tsx`

**API Service:** `frontend-new/services/api.ts` ✅
- authAPI, classAPI, problemAPI, submissionAPI, studentAPI
- JWT auto-injection
- Error handling
- TypeScript types

### ⚠️ Chưa Có (Nice-to-have)

- ❌ Edit Problem (UI + API)
- ❌ Delete Problem (UI + API)
- ❌ WebSocket real-time updates (đang dùng polling)
- ❌ Statistics dashboard
- ❌ Bulk grading

---

## 8. TROUBLESHOOTING

### 🔧 Common Issues

#### 1. Worker không chạy được

**Lỗi:** `ModuleNotFoundError: No module named 'pika'`

**Fix:**
```bash
cd grader-engine
source venv/bin/activate
pip install -r requirements.txt
```

#### 2. Docker image không tồn tại

**Lỗi:** `Image cpp-grader-env not found`

**Fix:**
```bash
docker build -t cpp-grader-env ./grader-engine
```

#### 3. Database connection refused

**Lỗi:** `could not connect to server: Connection refused`

**Fix:**
```bash
docker-compose up -d postgres
# Đợi 5 giây để postgres khởi động
docker exec -it code-grader-project-backend-1 flask db upgrade
```

#### 4. RabbitMQ connection failed

**Lỗi:** `pika.exceptions.AMQPConnectionError`

**Fix:**
```bash
docker-compose up -d rabbitmq
# Đợi 10 giây
./run_worker.sh
```

#### 5. Frontend không connect được Backend

**Lỗi:** `Network Error` hoặc `CORS error`

**Fix:**
```bash
# Kiểm tra backend đang chạy
curl http://localhost:5000/api/auth/profile

# Nếu không chạy:
docker-compose up -d backend

# Kiểm tra NEXT_PUBLIC_API_URL
cat frontend-new/.env.local
# Phải là: NEXT_PUBLIC_API_URL=http://localhost:5000
```

#### 6. Submission bị stuck ở "queued"

**Lỗi:** Status không bao giờ chuyển từ "queued"

**Fix:**
```bash
# Kiểm tra worker có đang chạy không
ps aux | grep "python run.py"

# Nếu không có, chạy lại:
./run_worker.sh

# Kiểm tra worker logs để thấy errors
```

#### 7. Permission denied khi tạo thư mục

**Lỗi:** `PermissionError: [Errno 13] Permission denied: '/workspaces/code-grader-project/grader-temp'`

**Fix:**
```bash
mkdir -p grader-temp
chmod 777 grader-temp
```

#### 8. Port already in use

**Lỗi:** `Port 5000 is already in use`

**Fix:**
```bash
# Tìm process đang dùng port
lsof -i :5000

# Kill process
kill -9 <PID>

# Hoặc restart containers
docker-compose restart backend
```

### 🔍 Debug Tips

**Xem logs:**
```bash
# Backend logs
docker-compose logs -f backend

# Database logs
docker-compose logs db

# RabbitMQ logs
docker-compose logs rabbitmq

# Worker logs (terminal đang chạy worker)
```

**Kiểm tra services:**
```bash
# Xem tất cả containers
docker ps

# Test backend API
curl http://localhost:5000/api/auth/profile

# Test RabbitMQ
curl -u guest:guest http://localhost:15672/api/overview
```

**Reset toàn bộ:**
```bash
# Dừng và xóa tất cả
docker-compose down -v

# Xóa grader-temp
rm -rf grader-temp

# Setup lại từ đầu
./setup.sh
```

---

## 9. API DOCUMENTATION

### Authentication Endpoints

#### POST /api/auth/register
Đăng ký tài khoản mới.

**Request:**
```json
{
  "full_name": "Nguyen Van A",
  "email": "student@example.com",
  "password": "password123",
  "role": "student"  // "student" hoặc "teacher"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "full_name": "Nguyen Van A",
    "email": "student@example.com",
    "role": "student"
  }
}
```

#### POST /api/auth/login
Đăng nhập.

**Request:**
```json
{
  "email": "student@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "full_name": "Nguyen Van A",
    "email": "student@example.com",
    "role": "student"
  }
}
```

#### GET /api/auth/profile
Lấy thông tin user hiện tại (cần JWT token).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": 1,
  "full_name": "Nguyen Van A",
  "email": "student@example.com",
  "role": "student",
  "created_at": "2025-01-15T10:30:00"
}
```

### Class Endpoints

#### POST /api/classes
Tạo lớp mới (teacher only).

**Request:**
```json
{
  "name": "Data Structures",
  "course_code": "CS301",
  "description": "Advanced data structures course"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Data Structures",
  "course_code": "CS301",
  "description": "Advanced data structures course",
  "invite_code": "abc123def",
  "teacher_id": 1,
  "created_at": "2025-01-15T10:30:00"
}
```

#### GET /api/classes
Lấy danh sách lớp của user.
- Teacher: Lấy các lớp mình tạo
- Student: Lấy các lớp đã join

**Response:**
```json
[
  {
    "id": 1,
    "name": "Data Structures",
    "course_code": "CS301",
    "description": "...",
    "invite_code": "abc123def",  // Chỉ teacher thấy
    "teacher": {
      "id": 1,
      "full_name": "Teacher Name"
    },
    "student_count": 24,
    "created_at": "2025-01-15T10:30:00"
  }
]
```

#### GET /api/classes/{id}
Lấy chi tiết một lớp.

#### POST /api/classes/join
Join lớp bằng invite code (student only).

**Request:**
```json
{
  "invite_code": "abc123def"
}
```

#### GET /api/classes/{id}/students
Lấy danh sách học sinh trong lớp (teacher only).

### Problem Endpoints

#### POST /api/classes/{class_id}/problems
Tạo bài tập mới (teacher only).

**Request:**
```json
{
  "title": "Two Sum",
  "description": "Find two numbers that add up to target...",
  "difficulty": "medium",
  "grading_mode": "stdio",
  "time_limit_ms": 1000,
  "memory_limit_kb": 256000,
  "test_cases": [
    {
      "input": "1 2 3 4\n5",
      "output": "1 4",
      "is_hidden": false,
      "points": 50
    }
  ]
}
```

#### GET /api/classes/{class_id}/problems
Lấy danh sách bài tập trong lớp.

#### GET /api/problems/{id}
Lấy chi tiết bài tập (bao gồm test cases).

#### GET /api/problems/{id}/submissions
Lấy tất cả submissions của bài tập (teacher only).

### Submission Endpoints

#### POST /api/submissions
Submit code.

**Request:**
```json
{
  "problem_id": 1,
  "source_code": "#include<iostream>\nusing namespace std;\nint main(){...}",
  "language": "cpp"
}
```

**Response:**
```json
{
  "id": 1,
  "problem_id": 1,
  "student_id": 1,
  "status": "queued",
  "submitted_at": "2025-01-15T10:35:00"
}
```

#### GET /api/submissions/{id}
Lấy kết quả submission.

**Response:**
```json
{
  "id": 1,
  "problem_id": 1,
  "student_id": 1,
  "status": "accepted",
  "score": 100,
  "passed_tests": 5,
  "total_tests": 5,
  "execution_time_ms": 150,
  "memory_used_kb": 2048,
  "submitted_at": "2025-01-15T10:35:00",
  "test_results": [
    {
      "test_case_id": 1,
      "status": "passed",
      "execution_time_ms": 30,
      "memory_used_kb": 2048
    }
  ]
}
```

### Student Endpoints

#### GET /api/students/me/submissions
Lấy lịch sử submissions của student.

**Query params:** `?problem_id=1` (optional)

#### GET /api/students/me/classes/{class_id}/problems-status
Lấy status của tất cả problems trong lớp cho student.

**Response:**
```json
[
  {
    "problem_id": 1,
    "title": "Two Sum",
    "difficulty": "medium",
    "status": "accepted",
    "best_score": 100,
    "attempts": 3
  }
]
```

---

## 📞 Support & Contact

Nếu gặp vấn đề không thể giải quyết:
1. Kiểm tra phần [Troubleshooting](#8-troubleshooting)
2. Xem logs của từng service
3. Reset toàn bộ với `docker-compose down -v && ./setup.sh`

---

**Chúc bạn sử dụng Code Grader thành công!** 🎉
