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

Docker Compose sẽ tự động khởi động 4 services:
- **Database** (PostgreSQL)
- **Backend** (Flask API)
- **Queue** (RabbitMQ)
- **Worker** (Grader Engine)

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

### 2.2. Kiểm Tra Services Đang Chạy

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

# Theo dõi logs real-time
docker compose logs -f worker
```

### 2.3. Chạy Database Migrations

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

### 2.4. (Tùy chọn) Seed Dữ Liệu Test

```bash
# Tạo dữ liệu mẫu cho development
docker compose exec backend flask seed-data
```

---

## ⚛️ BƯỚC 3: Chạy Frontend (Độc lập)

Frontend chạy độc lập bên ngoài Docker để dễ dàng development.

### 3.1. Cài Đặt Dependencies

```bash
# Di chuyển vào thư mục frontend
cd frontend-new

# Cài đặt packages với pnpm
pnpm install
```

### 3.2. Cấu Hình API Endpoint

Kiểm tra file `frontend-new/services/api.ts` để đảm bảo API URL đúng:

```typescript
const API_BASE_URL = 'http://localhost:5000/api';
```

### 3.3. Chạy Development Server

```bash
# Vẫn trong thư mục frontend-new
pnpm dev
```

Frontend sẽ chạy tại: **http://localhost:3000**

---

## ✅ BƯỚC 4: Kiểm Tra Hệ Thống

### 4.1. Kiểm Tra Các Services

| Service | URL | Mô Tả |
|---------|-----|-------|
| **Frontend** | http://localhost:3000 | Giao diện web |
| **Backend API** | http://localhost:5000/api | REST API |
| **API Docs** | http://localhost:5000/api/docs | Swagger UI |
| **RabbitMQ UI** | http://localhost:15672 | Queue Management |
| **Database** | localhost:5432 | PostgreSQL |

### 4.2. Test Backend API

```bash
# Health check
curl http://localhost:5000/api/health

# Hoặc mở browser
http://localhost:5000/api/health
```

**Kết quả mong đợi:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-18T..."
}
```

### 4.3. Truy Cập RabbitMQ Management

- URL: http://localhost:15672
- Username: `guest`
- Password: `guest`

### 4.4. Test Frontend

1. Mở browser: http://localhost:3000
2. Đăng ký tài khoản mới hoặc đăng nhập
3. Thử tạo class (Teacher) hoặc join class (Student)

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

# Xem logs
docker compose logs -f backend
docker compose logs -f worker

# Rebuild service cụ thể
docker compose up -d --build backend
docker compose up -d --build worker

# Vào container để debug
docker compose exec backend bash
docker compose exec worker bash
docker compose exec postgres psql -U postgres -d code_grader
```

### Frontend Commands

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

### Vấn Đề 3: Worker Không Chấm Bài

**Triệu chứng:** Submit code nhưng không thấy kết quả

**Giải pháp:**
```bash
# Kiểm tra worker logs
docker compose logs -f worker

# Restart worker
docker compose restart worker

# Kiểm tra RabbitMQ
# Mở http://localhost:15672
# Xem queue "grading_queue" có message không
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

### Vấn Đề 6: pnpm Install Lỗi

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

---

## 🔄 Workflow Development

### Quy Trình Làm Việc Hàng Ngày

1. **Bật Docker Desktop**

2. **Start Backend Services:**
```bash
docker compose up -d
```

3. **Start Frontend:**
```bash
cd frontend-new
pnpm dev
```

4. **Development...**
   - Code changes trong `backend/` tự động reload (hot reload)
   - Code changes trong `frontend-new/` tự động reload (Next.js Fast Refresh)
   - Worker changes cần rebuild: `docker compose up -d --build worker`

5. **Kết Thúc:**
```bash
# Stop frontend: Ctrl+C trong terminal
# Stop backend:
docker compose down
```

---

## 📊 Kiến Trúc Hệ Thống

```
┌─────────────────┐
│   Frontend      │  http://localhost:3000
│   (Next.js)     │  Chạy độc lập với pnpm dev
└────────┬────────┘
         │ API Calls (HTTP)
         ↓
┌─────────────────┐
│   Backend       │  http://localhost:5000
│   (Flask API)   │  Docker Container
└────────┬────────┘
         │
    ┌────┴────┬──────────────┐
    │         │              │
    ↓         ↓              ↓
┌────────┐ ┌────────┐ ┌──────────┐
│Database│ │RabbitMQ│ │  Worker  │
│Postgres│ │ Queue  │ │  Grader  │
└────────┘ └────────┘ └──────────┘
   5432       5672        (Docker)
```

**Luồng Chấm Bài:**
1. Student submit code qua Frontend
2. Frontend gửi request đến Backend API
3. Backend lưu submission vào Database
4. Backend đẩy job vào RabbitMQ Queue
5. Worker nhận job từ Queue
6. Worker chạy code trong Docker container
7. Worker lưu kết quả vào Database
8. Frontend polling/refresh để xem kết quả

---

## 🎓 Tài Liệu Bổ Sung

- **API Documentation:** http://localhost:5000/api/docs (Swagger)
- **Backend Details:** Xem file `docs/BACKEND_DOCUMENTATION.md`
- **Worker Details:** Xem file `docs/WORKER_DOCUMENTATION.md`
- **Frontend Structure:** Xem file `frontend-new/STRUCTURE.md`
- **Nguồn Tham Khảo:** Xem file `docs/REFERENCES.md`

---

## 💡 Tips & Best Practices

### Development Tips

1. **Sử dụng Git Branch:**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Kiểm tra logs thường xuyên:**
   ```bash
   docker compose logs -f backend worker
   ```

3. **Backup database trước khi thay đổi schema:**
   ```bash
   docker compose exec postgres pg_dump -U postgres code_grader > backup.sql
   ```

4. **Test API với Swagger UI:**
   - Mở http://localhost:5000/api/docs
   - Thử các endpoints trực tiếp

### Production Deployment

**⚠️ QUAN TRỌNG:** Trước khi deploy production:

1. Đổi `SECRET_KEY` trong `.env`
2. Tắt `FLASK_DEBUG=0`
3. Đổi password database
4. Cấu hình HTTPS
5. Setup reverse proxy (Nginx)
6. Backup database thường xuyên

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề:

1. Kiểm tra phần **Troubleshooting** ở trên
2. Xem logs: `docker compose logs`
3. Tìm trong file `docs/`
4. Tạo issue trên GitHub
5. Liên hệ team qua email

---

## ✅ Checklist Cài Đặt Thành Công

- [ ] Docker Desktop đang chạy
- [ ] File `.env` đã tạo với đúng config
- [ ] `docker compose ps` hiển thị 4 services running
- [ ] Backend API health check OK: http://localhost:5000/api/health
- [ ] RabbitMQ UI accessible: http://localhost:15672
- [ ] Database migrations đã chạy
- [ ] Frontend đã cài dependencies (`pnpm install`)
- [ ] Frontend chạy được: http://localhost:3000
- [ ] Có thể đăng ký/đăng nhập
- [ ] Có thể submit code và nhận kết quả

---

**🎉 Chúc bạn development vui vẻ!**

**Last Updated:** October 2025  
**Maintained by:** Code Grader Development Team
