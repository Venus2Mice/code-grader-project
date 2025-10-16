# 📋 TÓM TẮT NHANH - CODE GRADER

> Tài liệu tóm tắt siêu ngắn gọn cho người vội

---

## ⚡ CHẠY NGAY

```bash
# Cách 1: Tự động hoàn toàn
./setup.sh

# Cách 2: Thủ công
docker-compose up -d              # Khởi động services
docker build -t cpp-grader-env ./grader-engine
./run_worker.sh                   # Chạy worker
```

---

## 🌐 TRUY CẬP

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- RabbitMQ: http://localhost:15672

**Login:**
- Teacher: `teacher.dev@example.com` / `password`
- Student: `student.dev@example.com` / `password`

---

## ✅ FIX GÌ?

**Lỗi cũ:**
```
bind source path does not exist: /app/submission_XXX
```

**Fix:**
- Worker chạy **trực tiếp trên host** (không trong Docker)
- Không còn lỗi Docker-in-Docker mount path
- Dễ debug, hot reload, hiệu năng tốt hơn

---

## 📚 ĐỌC THÊM

- **Hướng dẫn đầy đủ:** [COMPLETE_GUIDE.md](./COMPLETE_GUIDE.md)
- **README:** [README.md](./README.md)

---

## 🔧 TROUBLESHOOTING 1-LINE

```bash
# Service không chạy?
docker-compose up -d

# Image không có?
docker build -t cpp-grader-env ./grader-engine

# Worker lỗi?
./run_worker.sh

# Reset toàn bộ?
docker-compose down -v && ./setup.sh
```

---

## 📦 CẤU TRÚC

```
├── backend/          # Flask API
├── frontend/         # React UI
├── grader-engine/    # Worker + Docker sandbox
├── grader-temp/      # Thư mục tạm (tự động tạo)
├── setup.sh          # Setup tự động
├── run_worker.sh     # Chạy worker standalone
└── COMPLETE_GUIDE.md # Hướng dẫn đầy đủ ⭐
```

---

## ✨ FEATURES

- ✅ Submit code C++ online
- ✅ Auto grading với test cases
- ✅ Kết quả tức thì (Accepted, Wrong Answer, TLE, etc.)
- ✅ Teacher tạo classes & problems
- ✅ Student join class bằng invite code
- ✅ Sandbox Docker (an toàn)
- ✅ Queue-based grading (RabbitMQ)

---

**Hết!** 🎉
