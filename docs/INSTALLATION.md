# 🚀 HƯỚNG DẪN CÀI ĐẶT - CODE GRADER PROJECT

Hướng dẫn cài đặt nhanh cho hệ thống Code Grader với Docker Compose và Frontend độc lập.

---

## 📋 Yêu Cầu Hệ Thống

### Phần Mềm Bắt Buộc

- **Docker Desktop** (phiên bản 20.10 trở lên)
  - Download: https://www.docker.com/products/docker-desktop
  - Đảm bảo Docker Desktop đang chạy
  
- **Node.js** (phiên bản 18 trở lên)
  - Download: https://nodejs.org/
  - Kiểm tra: `node --version`

- **pnpm** (Package manager cho Frontend)
  - Cài đặt: `npm install -g pnpm`
  - Kiểm tra: `pnpm --version`

### Tùy Chọn (Recommended)

- **Git** - Để clone repository
- **VSCode** - IDE khuyên dùng
- **Postman** - Test API

---

## 🔧 BƯỚC 1: Chuẩn Bị

### 1.1. Clone Repository

```bash
git clone https://github.com/Venus2Mice/code-grader-project.git
cd code-grader-project
```

### 1.2. Tạo File Môi Trường (.env)

Tạo file `.env` trong thư mục gốc của dự án:

```bash
# Tạo file .env
touch .env   # Linux/Mac
# hoặc
echo. > .env  # Windows
```

**Nội dung file `.env`:**

```env
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=code_grader

# Backend Configuration
SECRET_KEY=your-secret-key-change-in-production
FLASK_APP=run.py
FLASK_DEBUG=1

# RabbitMQ Configuration
RABBITMQ_HOST=rabbitmq

# Worker Configuration
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/code_grader
BACKEND_API_URL=http://backend:5000
```

---

## 🐳 BƯỚC 2: Chạy Backend Services với Docker Compose

Docker Compose sẽ tự động khởi động các services:
- **Frontend** (Next.js - Development Mode)
- **Database** (PostgreSQL)
- **Backend** (Flask API)
- **Queue** (RabbitMQ)
- **Worker** (Go Grader Engine - Production Ready)

### 2.1. Build và Start Services

```bash
# Build và start tất cả services
docker compose up -d --build

# Hoặc chỉ build mà không start
docker compose build

# Start services (nếu đã build)
docker compose up -d
```

**Giải thích:**
- `up`: Khởi động services
- `-d`: Chạy ở chế độ background (detached)
- `--build`: Build lại images trước khi start

### 2.2. Build Sandbox Image (Bắt buộc cho Worker)

Go Worker cần Docker image để chạy code của sinh viên:

```bash
# Tạo Dockerfile.sandbox trong grader-engine-go/
# (Nếu chưa có)

# Build sandbox image
docker build -f grader-engine-go/Dockerfile.sandbox -t code-grader-project-sandbox:latest .

# Kiểm tra image đã tạo
docker images | grep code-grader-project-sandbox
```

**Sandbox Image chứa:**
- GCC/G++ compiler
- Python interpreter
- Cơ chế isolation (resource limits, timeout)

### 2.3. Kiểm Tra Services Đang Chạy

```bash
# Xem danh sách containers
docker compose ps

# Xem logs của tất cả services
docker compose logs

# Xem logs của service cụ thể
docker compose logs backend
docker compose logs worker
docker compose logs postgres
docker compose logs rabbitmq
docker compose logs frontend

# Theo dõi logs real-time của Go Worker
docker compose logs -f worker

# Theo dõi logs của tất cả services
docker compose logs -f
```

**Output mong đợi từ Worker:**
```
worker    | 2025-10-22 10:30:45 INFO Starting Go Grader Worker
worker    | 2025-10-22 10:30:46 INFO Connected to RabbitMQ
worker    | 2025-10-22 10:30:47 INFO Listening for grading tasks...
worker    | 2025-10-22 10:30:48 INFO Task received: Grading submission_123
worker    | 2025-10-22 10:30:49 INFO Created sandbox container for submission_123
worker    | 2025-10-22 10:30:52 INFO Compilation successful
worker    | 2025-10-22 10:31:00 INFO All tests passed
worker    | 2025-10-22 10:31:01 INFO Result saved to database
```

### 2.4. Chạy Database Migrations

Sau khi services đã chạy, cần tạo bảng trong database:

```bash
# Vào container backend
docker compose exec backend bash

# Trong container, chạy migration
flask db upgrade

# Thoát container
exit
```

**Hoặc chạy trực tiếp:**

```bash
docker compose exec backend flask db upgrade
```

### 2.5. (Tùy chọn) Seed Dữ Liệu Test

```bash
# Tạo dữ liệu mẫu cho development
docker compose exec backend flask seed-data
```

### 2.6. Kiểm Tra Worker (Go Grader Engine)

```bash
# Kiểm tra logs của worker để đảm bảo nó đang chạy
docker compose logs worker

# Hoặc theo dõi real-time
docker compose logs -f worker
```

**Go Worker là production-ready implementation của Grader Engine:**
- ✅ Được viết bằng Go (hiệu năng cao)
- ✅ Hỗ trợ C++ (GCC/G++)
- ✅ Hỗ trợ Python
- ✅ Comprehensive error detection (Runtime errors, timeouts, memory limits)
- ✅ Sandbox isolation (Docker containers)
- ✅ Detailed error messages với hướng dẫn debugging

---

## ⚛️ BƯỚC 3: Chạy Frontend (Trong Docker hoặc Độc lập)

Frontend có thể chạy theo 2 cách:

### Cách 1: Chạy trong Docker (Khuyến nghị)

Docker Compose đã include frontend service:

```bash
# Nếu đã chạy docker compose up -d
# Frontend sẽ tự động chạy tại http://localhost:3000
docker compose logs -f frontend
```

**Ưu điểm:**
- ✅ Cài đặt tự động
- ✅ Hot reload hoạt động
- ✅ Không cần cài Node.js trên máy
- ✅ Môi trường dev giống production

### Cách 2: Chạy Độc lập (Development nâng cao)

Nếu muốn control hơn hoặc debug:

#### 3.1. Cài Đặt Dependencies

```bash
# Di chuyển vào thư mục frontend
cd frontend-new

# Cài đặt packages với pnpm
pnpm install

# Hoặc dùng npm
npm install
```

#### 3.2. Cấu Hình API Endpoint

Kiểm tra file `frontend-new/services/api.ts` để đảm bảo API URL đúng:

```typescript
const API_BASE_URL = 'http://localhost:5000/api';
```

#### 3.3. Chạy Development Server

```bash
# Vẫn trong thư mục frontend-new
pnpm dev

# Hoặc
npm run dev
```

Frontend sẽ chạy tại: **http://localhost:3000**

---

## ✅ BƯỚC 4: Kiểm Tra Hệ Thống

### 4.1. Kiểm Tra Các Services

| Service | URL | Docker | Status |
|---------|-----|--------|--------|
| **Frontend** | http://localhost:3000 | ✅ In Docker | Giao diện web |
| **Backend API** | http://localhost:5000/api | ✅ In Docker | REST API |
| **API Docs** | http://localhost:5000/api/docs | ✅ In Docker | Swagger UI |
| **RabbitMQ UI** | http://localhost:15672 | ✅ In Docker | Queue Management |
| **Database** | localhost:5432 | ✅ In Docker | PostgreSQL |
| **Go Worker** | Docker Container | ✅ In Docker | Grader Engine |

### 4.2. Test Backend API

```bash
# Health check
curl http://localhost:5000/api/health

# Hoặc mở browser
# http://localhost:5000/api/health
```

**Kết quả mong đợi:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-22T..."
}
```

### 4.3. Test Go Worker Kết Nối

```bash
# Kiểm tra worker logs
docker compose logs worker

# Nên thấy messages:
# "Connected to RabbitMQ"
# "Listening for grading tasks..."
# "Task received: Grading submission_123"
```

### 4.4. Truy Cập RabbitMQ Management

- URL: http://localhost:15672
- Username: `guest`
- Password: `guest`

**Kiểm tra:**
- Xem queue: `grading_queue`
- Xem connections từ Go Worker

### 4.5. Test Frontend và Submit Code

1. Mở browser: http://localhost:3000
2. Đăng ký tài khoản mới hoặc đăng nhập
3. Thử tạo class (Teacher) hoặc join class (Student)
4. **Submit code C++ test** để kiểm tra Go Worker hoạt động
5. Kiểm tra kết quả từ Go Worker trong logs: `docker compose logs -f worker`

**Test Code Mẫu:**
```cpp
#include <iostream>
using namespace std;

int main() {
    cout << "Hello, Code Grader!" << endl;
    return 0;
}
```

Nếu hoàn thành mà không lỗi, Go Worker đang hoạt động ✅

---

## 🎯 BƯỚC 5: Tài Khoản Test (Nếu đã seed data)

Nếu bạn đã chạy `flask seed-data`, có thể dùng các tài khoản sau:

### Teacher Account
- Email: `teacher.dev@example.com`
- Password: `password`

### Student Account
- Email: `student.dev@example.com`
- Password: `password`

---

## 📝 Các Lệnh Thường Dùng

### Docker Compose Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# Stop và xóa volumes (xóa database)
docker compose down -v

# Restart service cụ thể
docker compose restart backend
docker compose restart worker
docker compose restart frontend

# Xem logs
docker compose logs -f backend
docker compose logs -f worker
docker compose logs -f frontend

# Rebuild service cụ thể
docker compose up -d --build backend
docker compose up -d --build worker
docker compose up -d --build frontend

# Vào container để debug
docker compose exec backend bash
docker compose exec worker bash
docker compose exec frontend bash
docker compose exec postgres psql -U postgres -d code_grader

# Build Go Worker nếu thay đổi code
cd grader-engine-go
./build.sh  # Hoặc docker build -f Dockerfile -t grader-engine-go:latest .
```

### Frontend Commands (Khi chạy độc lập)

```bash
cd frontend-new

# Development
pnpm dev

# Build production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint

# Clean node_modules
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

### Go Worker Commands

```bash
cd grader-engine-go

# Build Docker image
docker build -f Dockerfile -t grader-worker:latest .

# Build Sandbox image
docker build -f Dockerfile.sandbox -t code-grader-project-sandbox:latest .

# Run tests
./test.sh

# View Go code
cat main.go
cat internal/grader/*.go
```

### Database Commands

```bash
# Tạo migration mới
docker compose exec backend flask db migrate -m "Description"

# Chạy migration
docker compose exec backend flask db upgrade

# Rollback migration
docker compose exec backend flask db downgrade

# Kết nối vào database
docker compose exec postgres psql -U postgres -d code_grader

# Backup database
docker compose exec postgres pg_dump -U postgres code_grader > backup.sql

# Restore database
docker compose exec -T postgres psql -U postgres code_grader < backup.sql
```

---

## 🔍 Troubleshooting

### Vấn Đề 1: Docker Compose Không Start

**Triệu chứng:** Services không khởi động

**Giải pháp:**
```bash
# Kiểm tra Docker Desktop đang chạy
docker --version

# Xem logs để tìm lỗi
docker compose logs

# Dọn dẹp và start lại
docker compose down
docker compose up -d --build
```

### Vấn Đề 2: Database Connection Error

**Triệu chứng:** Backend không kết nối được database

**Giải pháp:**
```bash
# Kiểm tra Postgres đang chạy
docker compose ps postgres

# Restart postgres
docker compose restart postgres

# Kiểm tra connection
docker compose exec postgres psql -U postgres -d code_grader

# Xem logs của postgres
docker compose logs postgres
```

### Vấn Đề 3: Go Worker Không Chấm Bài

**Triệu chứng:** Submit code nhưng không thấy kết quả, hoặc Worker không nhận task

**Giải pháp:**
```bash
# 1. Kiểm tra worker logs
docker compose logs -f worker

# 2. Kiểm tra docker image sandbox có sẵn không
docker images | grep sandbox
# Nếu không có, tạo:
docker build -f grader-engine-go/Dockerfile.sandbox -t code-grader-project-sandbox:latest .

# 3. Restart worker
docker compose restart worker

# 4. Kiểm tra RabbitMQ connection
# Mở http://localhost:15672
# Xem queue "grading_queue" có message không

# 5. Kiểm tra Go Worker logs chi tiết
docker compose logs worker --tail=100

# 6. Đảm bảo database URL đúng trong docker-compose.yml
# DATABASE_URL=postgresql://postgres:postgres@postgres:5432/code_grader
```

**Expected logs từ Go Worker:**
```
worker    | Starting Go Grader Worker...
worker    | Connected to RabbitMQ at rabbitmq:5672
worker    | Connected to Database
worker    | Listening for grading tasks on queue: grading_queue
worker    | [Task #1] Processing submission_123
worker    | [Task #1] Sandbox created: container_abc123
worker    | [Task #1] Compilation successful
worker    | [Task #1] Running 3 test cases...
worker    | [Task #1] All tests passed!
worker    | [Task #1] Result saved to database
```

### Vấn Đề 4: Frontend Không Gọi Được API

**Triệu chứng:** Lỗi CORS hoặc Network Error

**Giải pháp:**
1. Kiểm tra Backend đang chạy: http://localhost:5000/api/health
2. Kiểm tra API URL trong `frontend-new/services/api.ts`
3. Xem browser console để kiểm tra lỗi
4. Kiểm tra CORS config trong backend

### Vấn Đề 5: Port Đã Được Sử Dụng

**Triệu chứng:** `Error: Port 5000 is already allocated`

**Giải pháp:**
```bash
# Windows - Tìm process đang dùng port
netstat -ano | findstr :5000

# Linux/Mac
lsof -i :5000

# Kill process (thay PID bằng process ID)
# Windows
taskkill /PID <PID> /F

# Linux/Mac
kill -9 <PID>

# Hoặc đổi port trong docker-compose.yml
```

### Vấn Đề 6: Go Worker Docker Sandbox Error

**Triệu chứng:** Worker lỗi "Sandbox image not found" hoặc "Failed to create container"

**Giải pháp:**
```bash
# 1. Kiểm tra sandbox image
docker images | grep sandbox

# 2. Nếu không có, build lại
docker build -f grader-engine-go/Dockerfile.sandbox -t code-grader-project-sandbox:latest .

# 3. Xác minh image đã tạo
docker images | grep code-grader-project-sandbox

# 4. Restart worker
docker compose restart worker

# 5. Kiểm tra docker socket
# Make sure docker socket is accessible
docker ps  # Nếu được thì OK

# 6. Kiểm tra worker logs
docker compose logs worker | grep -i sandbox
```

### Vấn Đề 7: pnpm Install Lỗi

**Triệu chứng:** Lỗi khi cài đặt dependencies

**Giải pháp:**
```bash
# Xóa cache và node_modules
cd frontend-new
rm -rf node_modules
rm pnpm-lock.yaml

# Cài lại
pnpm install

# Nếu vẫn lỗi, dùng npm
npm install
```

### Vấn Đề 8: Go Worker CPU/Memory Cao

**Triệu chứng:** Worker container dùng quá nhiều tài nguyên

**Giải pháp:**
```bash
# 1. Kiểm tra resource usage
docker stats

# 2. Giới hạn container resources trong docker-compose.yml
# Thêm vào worker service:
# deploy:
#   resources:
#     limits:
#       cpus: '2'
#       memory: 2G
#     reservations:
#       cpus: '1'
#       memory: 1G

# 3. Rebuild với resource limits
docker compose up -d --build worker

# 4. Giảm CONTAINER_POOL_SIZE nếu cần
# CONTAINER_POOL_SIZE=3  # Từ 5 xuống 3
```

---

## 🔄 Workflow Development

### Quy Trình Làm Việc Hàng Ngày

1. **Bật Docker Desktop**

2. **Start tất cả services:**
```bash
docker compose up -d --build
```

3. **Frontend có 2 cách chạy:**

   **Cách 1: Chạy trong Docker (Mặc định)**
   ```bash
   docker compose logs -f frontend
   ```
   
   **Cách 2: Chạy độc lập (Development)**
   ```bash
   cd frontend-new
   pnpm dev
   ```

4. **Development...**
   - Code changes trong `backend/` tự động reload (hot reload)
   - Code changes trong `frontend-new/` tự động reload (Next.js Fast Refresh)
   - Go Worker changes cần rebuild: `docker compose up -d --build worker`
   - Sandbox changes cần rebuild: `docker build -f grader-engine-go/Dockerfile.sandbox -t code-grader-project-sandbox:latest .`

5. **Kết Thúc:**
```bash
# Stop frontend: Ctrl+C trong terminal (nếu chạy độc lập)
# Stop tất cả services:
docker compose down
```

---

## 📊 Kiến Trúc Hệ Thống (Go Worker Version)

```
┌─────────────────┐
│   Frontend      │  http://localhost:3000
│   (Next.js)     │  ✅ Chạy trong Docker hoặc độc lập
└────────┬────────┘
         │ API Calls (HTTP)
         ↓
┌─────────────────┐
│   Backend       │  http://localhost:5000
│   (Flask API)   │  ✅ Docker Container
└────────┬────────┘
         │
    ┌────┴────┬──────────────┐
    │         │              │
    ↓         ↓              ↓
┌────────┐ ┌────────┐ ┌──────────────────┐
│Database│ │RabbitMQ│ │  Go Worker       │
│Postgres│ │ Queue  │ │  Grader Engine   │
└────────┘ └────────┘ └────────┬─────────┘
   5432       5672             │
                     ┌─────────┘
                     ↓
            ┌────────────────────┐
            │   Docker Sandbox   │
            │   Containers       │
            │ (Run Student Code) │
            └────────────────────┘
```

**Luồng Chấm Bài (Go Worker):**
1. Student submit code qua Frontend
2. Frontend gửi request đến Backend API
3. Backend lưu submission vào Database
4. Backend đẩy job vào RabbitMQ Queue
5. **Go Worker nhận job từ Queue**
6. **Worker tạo Docker Sandbox Container**
7. **Worker compile và run code trong Sandbox**
8. **Worker detect errors (Compile, Runtime, TimeLimit, Memory Limit)**
9. **Worker format detailed error messages với hướng dẫn debugging**
10. Worker lưu kết quả vào Database
11. Frontend hiển thị kết quả với error messages đã format

**Go Worker Capabilities:**
- ✅ Production-ready (Viết bằng Go)
- ✅ C++ Support (GCC/G++ compiler)
- ✅ Python Support
- ✅ Comprehensive Error Detection
  - Division by zero (SIGFPE)
  - Segmentation fault (SIGSEGV)
  - Memory limit exceeded
  - Time limit exceeded
  - Output limit exceeded
  - Compilation errors
- ✅ Detailed Error Messages với suggestions
- ✅ Sandbox Isolation (Docker containers)
- ✅ Resource Limits (CPU, Memory, Time)
- ✅ Test Case Support (stdio-based & function-based)

---

## 🎓 Tài Liệu Bổ Sung

- **API Documentation:** http://localhost:5000/api/docs (Swagger)
- **Backend Details:** Xem file `docs/BACKEND_DOCUMENTATION.md`
- **Go Worker Details:** Xem file `docs/WORKER_DOCUMENTATION.md`
- **Frontend Error Integration:** Xem file `docs/FRONTEND_ERROR_INTEGRATION.md`
- **Frontend Structure:** Xem file `frontend-new/ARCHITECTURE.md`
- **Nguồn Tham Khảo:** Xem file `docs/REFERENCES.md`

---

## 💡 Tips & Best Practices

### Go Worker Development Tips

1. **Kiểm tra Go Worker logs:**
   ```bash
   docker compose logs -f worker
   # Hoặc real-time
   docker compose logs worker --follow --tail=50
   ```

2. **Rebuild Go Worker sau khi thay đổi code:**
   ```bash
   cd grader-engine-go
   # Edit code, save
   # Rebuild
   docker compose up -d --build worker
   ```

3. **Test Go Worker trực tiếp:**
   ```bash
   cd grader-engine-go
   go test ./...
   ```

4. **Xem Go Worker source code:**
   ```bash
   cd grader-engine-go
   ls -la internal/grader/
   cat main.go
   cat internal/grader/comprehensive_error_detector.go
   ```

### Development Tips

1. **Sử dụng Git Branch:**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Kiểm tra logs thường xuyên:**
   ```bash
   docker compose logs -f backend worker frontend
   ```

3. **Backup database trước khi thay đổi schema:**
   ```bash
   docker compose exec postgres pg_dump -U postgres code_grader > backup.sql
   ```

4. **Test API với Swagger UI:**
   - Mở http://localhost:5000/api/docs
   - Thử các endpoints trực tiếp

### Production Deployment (Go Worker)

**⚠️ QUAN TRỌNG:** Trước khi deploy production:

1. **Tạo Sandbox Image cho Production:**
   ```bash
   docker build -f grader-engine-go/Dockerfile.sandbox -t code-grader-project-sandbox:latest .
   # Push to registry if using cloud
   docker tag code-grader-project-sandbox:latest myregistry/sandbox:latest
   docker push myregistry/sandbox:latest
   ```

2. **Go Worker Configuration:**
   ```bash
   # Adjust in docker-compose.yml:
   - CONTAINER_POOL_SIZE=10  # Số lượng sandbox containers
   - DOCKER_IMAGE=code-grader-project-sandbox:latest
   ```

3. **Backend Configuration:**
   - Đổi `SECRET_KEY` trong `.env`
   - Tắt `FLASK_DEBUG=0`
   - Đổi password database

4. **Security:**
   - Cấu hình HTTPS
   - Setup reverse proxy (Nginx)
   - Enable rate limiting

5. **Monitoring:**
   - Setup logs aggregation
   - Monitor Worker health
   - Alert on failures

6. **Backup:**
   - Backup database thường xuyên
   - Backup sandbox images
   - Test restore procedures

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề:

1. Kiểm tra phần **Troubleshooting** ở trên
2. Xem logs: `docker compose logs`
3. Tìm trong file `docs/`
4. Kiểm tra Go Worker logs chi tiết: `docker compose logs worker --tail=200`
5. Tạo issue trên GitHub
6. Liên hệ team qua email

---

## ✅ Checklist Cài Đặt Thành Công

- [ ] Docker Desktop đang chạy
- [ ] File `.env` đã tạo với đúng config
- [ ] `docker compose ps` hiển thị tất cả services running (frontend, backend, postgres, rabbitmq, worker)
- [ ] Backend API health check OK: http://localhost:5000/api/health
- [ ] RabbitMQ UI accessible: http://localhost:15672 (user: guest, pass: guest)
- [ ] Go Worker logs show: "Connected to RabbitMQ" và "Listening for grading tasks"
- [ ] Sandbox Docker image tồn tại: `docker images | grep sandbox`
- [ ] Database migrations đã chạy: `docker compose exec backend flask db upgrade`
- [ ] Frontend accessible: http://localhost:3000
- [ ] Có thể đăng ký/đăng nhập tài khoản
- [ ] Có thể submit C++ code
- [ ] Nhận kết quả từ Go Worker trong 5-10 giây
- [ ] Error messages hiển thị chi tiết với hướng dẫn

### Verification Commands

```bash
# Kiểm tra tất cả services
docker compose ps

# Kiểm tra logs tất cả services
docker compose logs | grep -i error

# Kiểm tra worker đang chạy
docker compose logs worker | tail -20

# Test submit code
# 1. Vào http://localhost:3000
# 2. Login
# 3. Submit code C++
# 4. Chờ kết quả (worker logs sẽ update)
# 5. Kiểm tra error message detail (nếu lỗi)
```

---

**🎉 Chúc bạn development vui vẻ!**

**Last Updated:** October 22, 2025
**Go Worker Version:** ✅ Production Ready
**Status:** ✅ Fully Tested & Deployed
**Maintained by:** Code Grader Development Team

---

## 📌 Ghi Chú Quan Trọng

### Go Worker vs Python Worker (Legacy)

| Feature | Go Worker | Python Worker |
|---------|-----------|---------------|
| Performance | ⚡ Fast | ⚠️ Slow |
| Error Detection | 🎯 Comprehensive | ⚠️ Basic |
| Error Messages | 📝 Detailed with hints | ⚠️ Generic |
| Memory Safety | ✅ Excellent | ⚠️ Fair |
| Sandbox | ✅ Docker | ⚠️ Docker |
| Test Cases | ✅ Both types | ⚠️ stdio only |
| Status | ✅ Production | ❌ Legacy |

**Khuyến cáo:** Luôn sử dụng Go Worker (grader-engine-go)

### Go Worker Features được sử dụng

✅ **Comprehensive Error Detection** - Phát hiện tất cả lỗi runtime
✅ **Detailed Error Messages** - Giải thích cụ thể what went wrong
✅ **Debugging Suggestions** - Gợi ý how to fix
✅ **Frontend Integration** - Error messages hiển thị đẹp
✅ **Sandbox Isolation** - Bảo vệ server từ malicious code
✅ **Resource Limits** - CPU, Memory, Time limits enforced

