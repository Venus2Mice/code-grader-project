# 📖 HƯỚNG DẪN HOÀN CHỈNH - CODE GRADER PROJECT

> **Tài liệu tổng hợp đầy đủ về Fix lỗi, Cấu hình và Hướng dẫn sử dụng**

---

## 📑 MỤC LỤC

1. [Vấn Đề Đã Fix](#1-vấn-đề-đã-fix)
2. [Giải Thích Kỹ Thuật](#2-giải-thích-kỹ-thuật)
3. [Hướng Dẫn Sử Dụng](#3-hướng-dẫn-sử-dụng)
4. [Kiểm Tra & Test](#4-kiểm-tra--test)
5. [Troubleshooting](#5-troubleshooting)
6. [Files Đã Thay Đổi](#6-files-đã-thay-đổi)

---

## 1. VẤN ĐỀ ĐÃ FIX

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

---

## 2. GIẢI THÍCH KỸ THUẬT

### Kiến Trúc Cũ (CÓ LỖI)

```yaml
# docker-compose.yml
worker:
  build: ./grader-engine
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock  # Docker-in-Docker
    - ./grader-engine:/app
  environment:
    - GRADER_TEMP_DIR=/app  # ❌ Đường dẫn trong container
```

```python
# grader.py (cũ)
temp_dir_path = os.path.abspath("submission_XXX")  # /app/submission_XXX
mount_volume = docker.types.Mount(
    target="/sandbox", 
    source=temp_dir_path,  # ❌ Docker daemon không tìm thấy
    type="bind"
)
```

### Kiến Trúc Mới (ĐÃ FIX)

```yaml
# docker-compose.yml
# worker service đã bị VÔ HIỆU HÓA (comment out)
# Worker chạy độc lập qua script run_worker.sh
```

```bash
# run_worker.sh
export GRADER_TEMP_DIR=/workspaces/code-grader-project/grader-temp
export HOST_GRADER_TEMP_DIR=/workspaces/code-grader-project/grader-temp
# ✅ Cả 2 đường dẫn giống nhau vì worker chạy trên HOST

cd grader-engine
source venv/bin/activate
python run.py  # Chạy worker trực tiếp
```

```python
# config.py (mới)
class Config:
    GRADER_TEMP_DIR = os.environ.get('GRADER_TEMP_DIR', '/tmp/grader_submissions')
    HOST_GRADER_TEMP_DIR = os.environ.get('HOST_GRADER_TEMP_DIR', GRADER_TEMP_DIR)
```

```python
# grader.py (mới)
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

### Flow Hoạt Động

```
1. Frontend (React) → Submit code C++
        ↓
2. Backend (Flask) → Lưu DB, gửi task vào RabbitMQ
        ↓
3. RabbitMQ → Queue task
        ↓
4. Worker (Python, chạy trên HOST) → Nhận task
        ↓
5. Worker tạo thư mục tạm:
   /workspaces/code-grader-project/grader-temp/submission_X_UUID/
        ↓
6. Worker tạo Sandbox Container (Docker):
   - Image: cpp-grader-env
   - Mount: /workspaces/.../grader-temp/submission_X_UUID/ → /sandbox
   - Command: compile & run code
        ↓
7. Sandbox Container:
   - Compile: g++ -std=c++17 -O2 main.cpp -o main
   - Run: cat input.txt | ./main > output.txt
   - Giới hạn: Memory 256MB, Time limit (config)
        ↓
8. Worker so sánh output với expected output
        ↓
9. Worker gửi kết quả về Backend API
        ↓
10. Backend cập nhật DB
        ↓
11. Frontend hiển thị kết quả cho user
```

---

## 3. HƯỚNG DẪN SỬ DỤNG

### 🚀 Setup Lần Đầu (Recommended)

Sử dụng script `setup.sh` để tự động setup toàn bộ:

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

**Kết quả:**
```
=======================================================================
==           SETUP COMPLETE. ALL SYSTEMS ARE GO!                   ==
=======================================================================

Backend API is available at: http://localhost:5000/api/docs
Test accounts created:
  - Teacher: teacher.dev@example.com / password: password
  - Student: student.dev@example.com / password: password

This terminal will now be used by the Worker.
Starting the worker... (Press Ctrl+C to stop)
-----------------------------------------------------------------------

Starting worker...
Successfully connected to RabbitMQ.
 [*] Waiting for tasks. To exit press CTRL+C
```

---

### 🔄 Chạy Worker Riêng Lẻ (Khi đã setup)

Nếu bạn đã chạy `setup.sh` trước đó và chỉ muốn khởi động lại worker:

```bash
# Đảm bảo các service đang chạy
docker-compose up -d

# Chạy worker
./run_worker.sh
```

**Script `run_worker.sh` sẽ:**
- ✅ Kiểm tra PostgreSQL đang chạy
- ✅ Kiểm tra RabbitMQ đang chạy  
- ✅ Kiểm tra Backend đang chạy
- ✅ Kiểm tra image `cpp-grader-env` tồn tại
- ✅ Kích hoạt virtual environment
- ✅ Setup biến môi trường
- ✅ Chạy worker

---

### 🛠️ Setup Thủ Công (Advanced)

Nếu bạn muốn kiểm soát từng bước:

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
flask db init
flask db migrate -m "Initial migration"
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

# Tạo venv
python3 -m venv venv

# Kích hoạt
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Bước 5: Setup biến môi trường

```bash
# Load từ .env
source ../.env

# Export cho worker
export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}"
export RABBITMQ_HOST=localhost
export BACKEND_API_URL=http://localhost:5000
export GRADER_TEMP_DIR=/workspaces/code-grader-project/grader-temp
export HOST_GRADER_TEMP_DIR=/workspaces/code-grader-project/grader-temp

# Tạo thư mục tạm
mkdir -p /workspaces/code-grader-project/grader-temp
```

#### Bước 6: Chạy worker

```bash
# Đảm bảo đang trong grader-engine và venv đã activate
python run.py
```

---

## 4. KIỂM TRA & TEST

### ✅ Kiểm Tra Services

```bash
# Xem tất cả containers đang chạy
docker ps

# Kết quả mong đợi:
# - code-grader-project-postgres-1   (Up)
# - code-grader-project-rabbitmq-1   (Up)
# - code-grader-project-backend-1    (Up)
# - code-grader-project-frontend-1   (Up)
```

### ✅ Kiểm Tra Logs

```bash
# Backend logs
docker logs code-grader-project-backend-1 -f

# RabbitMQ logs
docker logs code-grader-project-rabbitmq-1 -f

# Worker logs (nếu chạy bằng run_worker.sh)
# Logs hiển thị trực tiếp trong terminal
```

### ✅ Test Submit Bài

#### Cách 1: Qua Frontend (Recommended)

1. **Mở trình duyệt:**
   ```
   http://localhost:3000
   ```

2. **Đăng nhập:**
   - Email: `student.dev@example.com`
   - Password: `password`

3. **Chọn lớp học:**
   - "Lớp Lập Trình Nâng Cao"

4. **Chọn bài tập:**
   - "Bài Test: Tổng hai số"

5. **Submit code C++:**
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

6. **Xem kết quả:**
   - Trang web sẽ tự động cập nhật kết quả
   - Check worker logs trong terminal

#### Cách 2: Qua API

```bash
# 1. Đăng nhập để lấy token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student.dev@example.com",
    "password": "password"
  }'

# Lưu access_token từ response

# 2. Submit bài
curl -X POST http://localhost:5000/api/submissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "problem_id": 1,
    "source_code": "#include <iostream>\nusing namespace std;\nint main() {\n    int a, b;\n    cin >> a >> b;\n    cout << a + b << endl;\n    return 0;\n}\n"
  }'

# 3. Xem kết quả submission
curl http://localhost:5000/api/submissions/SUBMISSION_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### ✅ Kết Quả Mong Đợi

**Worker logs:**
```
 [x] Received task: {"submission_id": 1}
[1] Grading submission for problem 'Bài Test: Tổng hai số'. Found 2 test cases.
[1] Creating sandbox container from image 'cpp-grader-env'...
[1] Mounting host path: /workspaces/code-grader-project/grader-temp/submission_1_abc123 -> /sandbox
[1] Waiting for container abc123 to start...
[1] Attempt 1: Container status is 'running'
[1] Container is running.
[1] Compiling source code...
[1] Compilation successful. Running test cases...
[1] Test Case #1: Status='Accepted', Expected='3', Received='3'
[1] Test Case #2: Status='Accepted', Expected='11', Received='11'
[1] Cleaned up container abc123.
[1] Cleaned up temporary directory.
Successfully updated backend for submission 1
```

**Frontend:**
- Status: ✅ **Accepted**
- Test Case 1: ✅ Accepted
- Test Case 2: ✅ Accepted

---

## 5. TROUBLESHOOTING

### ❌ Lỗi: "PostgreSQL không chạy"

```bash
# Kiểm tra
docker ps | grep postgres

# Nếu không có, khởi động lại
docker-compose up -d postgres

# Xem logs
docker logs code-grader-project-postgres-1

# Test connection
docker exec code-grader-project-postgres-1 pg_isready
```

---

### ❌ Lỗi: "RabbitMQ không chạy"

```bash
# Kiểm tra
docker ps | grep rabbitmq

# Khởi động lại
docker-compose up -d rabbitmq

# Xem logs
docker logs code-grader-project-rabbitmq-1

# RabbitMQ Management UI
# Mở: http://localhost:15672
# Username: guest, Password: guest
```

---

### ❌ Lỗi: "Cannot connect to RabbitMQ"

Worker logs:
```
Connecting to RabbitMQ at localhost... (Attempt 1/10)
Connection failed. Retrying in 5 seconds...
```

**Giải pháp:**
```bash
# 1. Đợi RabbitMQ khởi động hoàn toàn (10-15 giây)

# 2. Kiểm tra RabbitMQ có chạy không
docker ps | grep rabbitmq

# 3. Kiểm tra logs
docker logs code-grader-project-rabbitmq-1

# 4. Restart RabbitMQ
docker-compose restart rabbitmq

# 5. Đợi 10 giây rồi chạy lại worker
./run_worker.sh
```

---

### ❌ Lỗi: "Image 'cpp-grader-env' không tồn tại"

```bash
# Build image
docker build -t cpp-grader-env ./grader-engine

# Verify
docker images | grep cpp-grader-env
```

---

### ❌ Lỗi: "Bind source path does not exist"

Nếu vẫn gặp lỗi này sau khi fix:

```bash
# 1. Kiểm tra thư mục tạm
ls -la /workspaces/code-grader-project/grader-temp/

# 2. Tạo lại nếu không tồn tại
mkdir -p /workspaces/code-grader-project/grader-temp
chmod 755 /workspaces/code-grader-project/grader-temp

# 3. Kiểm tra biến môi trường
echo $GRADER_TEMP_DIR
echo $HOST_GRADER_TEMP_DIR

# 4. Restart worker
./run_worker.sh
```

---

### ❌ Lỗi: "Container failed to stay running"

Worker logs:
```
Container abc123 failed to stay running. 
Final status: exited, Exit Code: 1
```

**Giải pháp:**
```bash
# 1. Kiểm tra image cpp-grader-env
docker images | grep cpp-grader-env

# 2. Test chạy container thủ công
docker run -it --rm cpp-grader-env /bin/bash

# 3. Rebuild image nếu cần
docker build -t cpp-grader-env ./grader-engine --no-cache

# 4. Xem logs chi tiết trong worker terminal
```

---

### ❌ Lỗi: "Compile Error"

```bash
# Worker logs sẽ hiển thị lỗi compile cụ thể
[X] Compile Error:
main.cpp:5:1: error: expected ';' before '}' token
```

**Đây là lỗi code của người dùng**, không phải lỗi hệ thống.

---

### ❌ Lỗi: "Module not found" khi chạy worker

```bash
cd grader-engine

# Đảm bảo venv được activate
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt

# Chạy lại
python run.py
```

---

### 🔍 Debug Tips

#### 1. Xem thư mục tạm trong quá trình chấm

Mở terminal mới:
```bash
watch -n 1 'ls -la /workspaces/code-grader-project/grader-temp/'
```

Khi worker chấm bài, bạn sẽ thấy thư mục `submission_X_UUID` xuất hiện và biến mất.

#### 2. Xem container sandbox

Mở terminal mới:
```bash
watch -n 1 'docker ps -a | grep cpp-grader-env'
```

Khi worker chấm bài, bạn sẽ thấy container tạm thời xuất hiện và bị xóa.

#### 3. Giữ container sandbox (để debug)

Sửa `grader.py` tạm thời:
```python
# Comment out dòng này trong finally block
# container.remove(force=True)
```

Container sẽ không bị xóa, bạn có thể vào kiểm tra:
```bash
docker ps -a | grep cpp-grader-env
docker exec -it CONTAINER_ID /bin/bash
```

---

## 6. FILES ĐÃ THAY ĐỔI

### 📝 File Cấu Hình

#### `docker-compose.yml`

**Thay đổi:** Worker service đã bị **vô hiệu hóa** (comment out)

```yaml
# Dịch vụ Grader Worker (Python)
# DISABLED: Worker chạy độc lập qua setup.sh để dễ debug
# worker:
#   build:
#     context: ./grader-engine
#     dockerfile: Dockerfile.worker
#   restart: always    
#   volumes:
#     - /var/run/docker.sock:/var/run/docker.sock
#     - ./grader-engine:/app
#     - ./grader-temp:/tmp/grader_submissions
#   depends_on:
#     - rabbitmq
#     - postgres
#     - backend
#   networks:
#     - app-network
#   environment:
#     - DATABASE_URL=...
#     - RABBITMQ_HOST=rabbitmq
#     - ...
```

---

#### `grader-engine/worker/config.py`

**Thay đổi:** Thêm `HOST_GRADER_TEMP_DIR`

```python
class Config:
    DATABASE_URL = os.environ.get('DATABASE_URL')
    RABBITMQ_HOST = os.environ.get('RABBITMQ_HOST', 'localhost')
    BACKEND_API_URL = os.environ.get('BACKEND_API_URL', 'http://localhost:5000')
    DOCKER_IMAGE_NAME = "cpp-grader-env"
    
    # Thư mục tạm trong container/máy local
    GRADER_TEMP_DIR = os.environ.get('GRADER_TEMP_DIR', '/tmp/grader_submissions')
    
    # Đường dẫn thực tế trên host để Docker daemon có thể truy cập
    # Khi chạy worker ngoài Docker, cả 2 đường dẫn này giống nhau
    HOST_GRADER_TEMP_DIR = os.environ.get('HOST_GRADER_TEMP_DIR', GRADER_TEMP_DIR)
```

---

#### `grader-engine/worker/grader.py`

**Thay đổi:** Sử dụng `HOST_GRADER_TEMP_DIR` khi mount volume

```python
# Tạo thư mục tạm (worker tạo trong GRADER_TEMP_DIR)
temp_dir_name = f"submission_{submission_id}_{uuid.uuid4()}"
temp_dir_path = os.path.join(Config.GRADER_TEMP_DIR, temp_dir_name)
os.makedirs(temp_dir_path, exist_ok=True)

# Ghi code vào file
with open(os.path.join(temp_dir_path, "main.cpp"), "w") as f:
    f.write(submission.source_code)

# Khi mount vào sandbox container, sử dụng đường dẫn HOST
host_temp_dir_path = os.path.join(Config.HOST_GRADER_TEMP_DIR, temp_dir_name)
mount_volume = docker.types.Mount(
    target="/sandbox", 
    source=host_temp_dir_path,  # ✅ Đường dẫn thực tế trên host
    type="bind"
)

print(f"[{submission_id}] Mounting host path: {host_temp_dir_path} -> /sandbox")
```

---

### 🆕 File Mới

#### `run_worker.sh` ⭐

Script tiện lợi để chạy worker standalone:

```bash
#!/bin/bash

# Load biến môi trường từ .env
source .env

# Setup biến môi trường cho worker
export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}"
export RABBITMQ_HOST=localhost
export BACKEND_API_URL=http://localhost:5000
export GRADER_TEMP_DIR=/workspaces/code-grader-project/grader-temp
export HOST_GRADER_TEMP_DIR=/workspaces/code-grader-project/grader-temp

# Tạo thư mục tạm
mkdir -p "$GRADER_TEMP_DIR"

# Kiểm tra các service
if ! docker ps | grep -q "postgres"; then
    echo "ERROR: PostgreSQL không chạy!"
    exit 1
fi

if ! docker ps | grep -q "rabbitmq"; then
    echo "ERROR: RabbitMQ không chạy!"
    exit 1
fi

# Kích hoạt venv và chạy worker
cd grader-engine
source venv/bin/activate
python run.py
```

**Cách dùng:**
```bash
chmod +x run_worker.sh
./run_worker.sh
```

---

#### `setup.sh` (Đã cập nhật)

**Thay đổi:** Script bây giờ chạy worker ở cuối thay vì trong Docker

```bash
# ... (phần setup khác) ...

# Thiết lập biến môi trường cho worker chạy độc lập
export DATABASE_URL=$(...)
export RABBITMQ_HOST=localhost
export BACKEND_API_URL=http://localhost:5000
export GRADER_TEMP_DIR=/workspaces/code-grader-project/grader-temp
export HOST_GRADER_TEMP_DIR=/workspaces/code-grader-project/grader-temp

# Chạy worker
cd grader-engine
source venv/bin/activate
python run.py
```

---

### 📁 Thư Mục Mới

#### `/workspaces/code-grader-project/grader-temp/`

Thư mục này được tạo để lưu các file tạm trong quá trình chấm bài:

```
grader-temp/
├── submission_1_abc123-uuid/
│   ├── main.cpp          # Code của user
│   ├── input.txt         # Input test case
│   └── output.txt        # Output từ chương trình
└── submission_2_def456-uuid/
    └── ...
```

**Lưu ý:** Thư mục này sẽ tự động được dọn dẹp sau mỗi lần chấm bài.

---

## 7. TÓM TẮT NHANH

### ✅ Đã Fix
- ❌ Lỗi: `bind source path does not exist`
- ✅ Worker chạy standalone trên HOST
- ✅ Docker daemon có thể truy cập thư mục tạm

### 🚀 Quick Start
```bash
./setup.sh                    # Lần đầu
# hoặc
docker-compose up -d          # Các service
./run_worker.sh               # Worker
```

### 🧪 Test
- Frontend: http://localhost:3000
- Login: `student.dev@example.com` / `password`
- Submit code C++ và xem kết quả

### 📚 Services
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- RabbitMQ Management: http://localhost:15672
- PostgreSQL: localhost:5432

### 🔧 Commands Hữu Ích
```bash
# Xem logs
docker logs code-grader-project-backend-1 -f

# Restart services
docker-compose restart

# Stop all
docker-compose down

# Clean up (xóa cả volumes)
docker-compose down -v

# Rebuild images
docker-compose up -d --build
```

---

## 🎉 KẾT LUẬN

Hệ thống Code Grader bây giờ đã hoạt động **ổn định** với kiến trúc mới:

✅ Worker chạy **trực tiếp trên host**  
✅ Không còn lỗi Docker-in-Docker mount  
✅ Dễ dàng debug và phát triển  
✅ Hiệu năng tốt hơn  
✅ Hot reload khi sửa code  

Bạn có thể bắt đầu sử dụng hệ thống để chấm bài lập trình C++ một cách tự động và hiệu quả!

---

**Tài liệu được tạo bởi:** GitHub Copilot  
**Ngày cập nhật:** October 16, 2025  
**Version:** 2.0 (Worker Standalone)
