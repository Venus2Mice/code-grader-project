# Code Grader - Hệ thống Chấm bài Lập trình C++ Tự động

> ⚠️ **LƯU Ý QUAN TRỌNG:** Worker bây giờ chạy **độc lập ngoài Docker**.  
> 📚 **Đọc hướng dẫn đầy đủ:** [COMPLETE_GUIDE.md](./COMPLETE_GUIDE.md)

**Code Grader** là một nền tảng ứng dụng web được thiết kế để tự động hóa quy trình chấm điểm các bài tập lập trình C++. Hệ thống cho phép giáo viên tạo lớp học, ra đề bài kèm theo các bộ dữ liệu kiểm thử (test case), và sinh viên có thể nộp bài làm của mình để nhận được phản hồi tức thì.

---

## 🚀 QUICK START

### Cài đặt và Chạy (Một lệnh duy nhất)

```bash
# Clone project
git clone https://github.com/Venus2Mice/code-grader-project.git
cd code-grader-project

# Tạo file .env
cp .env.example .env

# Chạy setup tự động (sẽ setup và chạy worker)
./setup.sh
```

**Hoặc chạy riêng từng bước:**

```bash
# 1. Khởi động các services (PostgreSQL, RabbitMQ, Backend, Frontend)
docker-compose up -d

# 2. Build image cho môi trường chấm C++
docker build -t cpp-grader-env ./grader-engine

# 3. Chạy worker (trong terminal riêng)
./run_worker.sh
```

### Truy cập

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **RabbitMQ Management:** http://localhost:15672 (guest/guest)

### Tài khoản Test

- **Teacher:** `teacher.dev@example.com` / `password`
- **Student:** `student.dev@example.com` / `password`

---

## 📚 TÀI LIỆU CHI TIẾT

Xem hướng dẫn đầy đủ tại: **[COMPLETE_GUIDE.md](./COMPLETE_GUIDE.md)**

Tài liệu bao gồm:
- ✅ Giải thích vấn đề đã fix (Docker-in-Docker mount path)
- ✅ Hướng dẫn setup chi tiết
- ✅ Cách test và kiểm tra
- ✅ Troubleshooting đầy đủ
- ✅ Giải thích kỹ thuật

---

## ✨ Tính năng Nổi bật

### Dành cho Giáo viên (Teacher)
-   **Quản lý Lớp học:** Tạo, xem danh sách và quản lý các lớp học của mình.
-   **Mã mời An toàn:** Mỗi lớp học có một mã mời (`invite_code`) duy nhất để gửi cho sinh viên.
-   **Quản lý Bài tập:** Dễ dàng tạo, sửa, xóa các bài tập lập trình trong mỗi lớp.
-   **Cấu hình Test Case:** Định nghĩa các bộ dữ liệu vào/ra (`input`/`output`) cho mỗi bài tập.
-   **Thiết lập Ràng buộc:** Giới hạn thời gian chạy (Time Limit) và bộ nhớ (Memory Limit) cho mỗi bài nộp.
-   **Xem Kết quả:** Theo dõi tiến độ và xem kết quả bài nộp của sinh viên.

### Dành cho Sinh viên (Student)
-   **Tham gia Lớp học:** Dễ dàng tham gia một lớp học bằng mã mời do giáo viên cung cấp.
-   **Nộp bài:** Gửi mã nguồn C++ để được chấm điểm.
-   **Phản hồi Tức thì:** Nhận kết quả chi tiết gần như ngay lập tức sau khi nộp bài.
-   **Kết quả Chi tiết:** Xem trạng thái của từng test case:
    -   `Accepted (AC)`: Chấp nhận
    -   `Wrong Answer (WA)`: Sai kết quả
    -   `Compile Error (CE)`: Lỗi biên dịch
    -   `Time Limit Exceeded (TLE)`: Vượt quá thời gian
    -   `Runtime Error (RE)`: Lỗi thực thi

### Hệ thống
-   **Chấm bài Bất đồng bộ:** Sử dụng RabbitMQ để xử lý các bài nộp theo hàng đợi, đảm bảo hệ thống luôn phản hồi nhanh chóng ngay cả khi có nhiều lượt nộp.
-   **Môi trường An toàn (Sandbox):** Mỗi bài nộp được biên dịch và thực thi trong một container Docker riêng biệt, giúp cách ly hoàn toàn và ngăn chặn các mã độc hại.

## 🏗️ Kiến trúc Hệ thống

```
+----------+      +-----------------+      +----------------+      +----------+
|          |----->| Frontend (React)|----->| Backend (Flask)|----->| RabbitMQ |
|  User    |      +-----------------+      +----------------+      +----------+
| (Browser)|                                       ^                     |
+----------+                                       | (CRUD)              | (Grading Task)
                                                     |                     v
                                             +-------+-------+      +---------------+
                                             |  PostgreSQL   |      | Worker (Python|
                                             +---------------+      |    + Docker)  |
                                                                    +---------------+
```

## 🛠️ Công nghệ Sử dụng

-   **Backend:** Python, Flask, Flask-SQLAlchemy, Flask-Migrate, Flask-JWT-Extended
-   **Worker:** Python, Docker SDK
-   **Frontend:** JavaScript, React.js (Chưa triển khai)
-   **Database:** PostgreSQL
-   **Message Queue:** RabbitMQ
-   **Containerization:** Docker, Docker Compose

## 🚀 Cài đặt và Khởi chạy

Dự án được thiết kế để có thể cài đặt và chạy chỉ bằng một lệnh duy nhất thông qua script `setup.sh`.

### Yêu cầu Cần thiết
-   [Docker](https://www.docker.com/get-started)
-   [Docker Compose](https://docs.docker.com/compose/install/) (Thường đi kèm với Docker Desktop)
-   [Python 3](https://www.python.org/downloads/)
-   [Git](https://git-scm.com/downloads/)

### Hướng dẫn Cài đặt Nhanh (Khuyến khích)

1.  **Clone Repository:**
    ```bash
    git clone <https://github.com/Venus2Mice/code-grader-project.git>
    cd <ten_thu_muc_project>
    ```

2.  **Cấu hình Môi trường:**
    Tạo một file `.env` ở thư mục gốc bằng cách copy từ file mẫu:
    ```bash
    cp .env.example .env
    ```
    Bạn có thể tùy chỉnh các giá trị trong file `.env` (ví dụ: `POSTGRES_PASSWORD`), nhưng các giá trị mặc định đã được thiết lập để hoạt động ngay.

3.  **Chạy Script Cài đặt:**
    Script này sẽ tự động dọn dẹp, build, khởi động các service, cài đặt CSDL và cuối cùng là chạy worker.

    ```bash
    # Cấp quyền thực thi cho script (chỉ cần làm một lần)
    chmod +x setup.sh

    # Chạy script!
    ./setup.sh
    ```

    Sau khi script chạy xong, toàn bộ hệ thống đã sẵn sàng!
    -   **API Backend** có thể truy cập tại: `http://localhost:5000`
    -   **Tài liệu API (Swagger UI)**: `http://localhost:5000/api/docs`
    -   **RabbitMQ Management**: `http://localhost:15672` (user: `guest`, pass: `guest`)
    -   Terminal hiện tại của bạn sẽ hiển thị log của **Worker**.

### 🧪 Tài khoản Test
Script cài đặt đã tạo sẵn các tài khoản để bạn có thể thử nghiệm ngay:
-   **Giáo viên:** `teacher.dev@example.com` / Mật khẩu: `password`
-   **Học sinh:** `student.dev@example.com` / Mật khẩu: `password`

## 👨‍💻 Chạy Riêng từng Phần (Dành cho Development)

Nếu bạn muốn chạy từng thành phần một cách độc lập để gỡ lỗi.

### 1. Chạy các Service Nền tảng (Postgres, RabbitMQ, Backend)
Lệnh này sẽ khởi động mọi thứ trừ worker, và bạn có thể chạy worker thủ công.
```bash
docker compose up --build
```
Sau đó, bạn có thể thực hiện các lệnh `flask db...` bằng `docker compose exec backend <lenh>`. hoặc `docker exec -it container-id bash`

### 2. Chạy Worker Thủ công
Đây là cách tốt nhất để debug cho worker.
```bash
# Di chuyển đến thư mục của worker
cd grader-engine

# Kích hoạt môi trường ảo
source venv/bin/activate

# Chạy worker (nó sẽ tự đọc file .env ở thư mục gốc)
python run_worker.py
```

### 3. Chạy Frontend (Khi đã có)
```bash
# Di chuyển đến thư mục frontend
cd frontend

# Cài đặt các thư viện
npm install

# Khởi động server development
npm start
```

## 🛑 Dừng Hệ thống

-   Nếu bạn đã chạy bằng script `setup.sh`, nhấn `Ctrl+C` trong terminal đang chạy worker.
-   Sau đó, chạy lệnh sau ở thư mục gốc để dừng và xóa các container:
    ```bash
    docker compose down
    ```
-   Để xóa cả dữ liệu database, dùng thêm cờ `-v`:
    ```bash
    docker compose down -v
    ```

## 📁 Cấu trúc Thư mục

```
.
├── backend/            # Chứa mã nguồn Flask Backend API
├── grader-engine/      # Chứa mã nguồn Worker chấm bài
├── frontend/           # (Tương lai) Chứa mã nguồn React Frontend
├── .env                # File cấu hình môi trường (cần được tạo)
├── .env.example        # File cấu hình môi trường mẫu
├── docker compose.yml  # Định nghĩa các service Docker
└── setup.sh            # Script cài đặt và khởi chạy tự động
```