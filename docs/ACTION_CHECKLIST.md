# ✅ CHECKLIST HÀNH ĐỘNG - CODE GRADER PROJECT

## 🚨 ƯU TIÊN CAO (Phải làm ngay)

### 1. Tạo Migration cho Database ⏰ 15 phút
```bash
cd /workspaces/code-grader-project/backend
flask db revision -m "add_frontend_required_fields"
# Kiểm tra file migration được tạo trong migrations/versions/
flask db upgrade
docker-compose restart backend
```

**Tại sao:** Backend models có các trường mới nhưng database chưa có columns!

**Kiểm tra:**
```bash
docker exec -it code-grader-project-db-1 psql -U postgres -d code_grader
\d problems      # Phải thấy difficulty, grading_mode, function_signature
\d test_cases    # Phải thấy points
\d classes       # Phải thấy description
\q
```

---

### 2. Test End-to-End ⏰ 30 phút

**Start services:**
```bash
cd /workspaces/code-grader-project
docker-compose up -d
./scripts/run_worker.sh  # Terminal riêng
```

**Test flow:**

#### A. Authentication
- [ ] Đăng ký tài khoản teacher: `teacher@test.com`
- [ ] Đăng ký tài khoản student: `student@test.com`
- [ ] Đăng xuất và đăng nhập lại
- [ ] Kiểm tra JWT token trong localStorage

#### B. Teacher Flow
- [ ] Tạo lớp mới với tên + mô tả
- [ ] Xem invite code của lớp
- [ ] Tạo bài tập với:
  - Title, description
  - Difficulty (easy/medium/hard)
  - Grading mode (stdio/function)
  - Time/Memory limits
  - Test cases với điểm số
- [ ] Xem danh sách bài tập trong lớp
- [ ] Vào xem chi tiết 1 bài tập

#### C. Student Flow
- [ ] Join lớp bằng invite code
- [ ] Xem danh sách lớp đã join
- [ ] Vào lớp, xem danh sách bài tập
- [ ] Click vào 1 bài tập
- [ ] Submit code (C++/Python)
- [ ] Đợi kết quả chấm
- [ ] Kiểm tra status (Accepted/Wrong Answer/etc)
- [ ] Xem lịch sử submissions
- [ ] Load lại code từ submission cũ

#### D. Grading System
- [ ] Submit code đúng → Accepted
- [ ] Submit code sai → Wrong Answer
- [ ] Submit code TLE → Time Limit Exceeded
- [ ] Submit code lỗi compile → Compile Error
- [ ] Kiểm tra execution time & memory
- [ ] Kiểm tra điểm số (từ points của test cases)

---

## ⚠️ ƯU TIÊN TRUNG BÌNH (Nên làm)

### 3. Kiểm tra Logs & Errors ⏰ 10 phút
```bash
# Backend logs
docker-compose logs -f backend

# Database logs
docker-compose logs db

# RabbitMQ logs
docker-compose logs rabbitmq

# Worker logs
# (Xem terminal đang chạy worker)
```

**Tìm:**
- [ ] Không có errors 500
- [ ] Database connections OK
- [ ] RabbitMQ connections OK
- [ ] Grading jobs processed successfully

---

### 4. Kiểm tra Security ⏰ 15 phút

- [ ] JWT token expires correctly
- [ ] Unauthorized requests → 401
- [ ] Student không thể access teacher endpoints
- [ ] Teacher không thể submit code
- [ ] CORS configured properly
- [ ] Passwords được hash (không plain text)
- [ ] Code execution trong Docker sandbox

---

### 5. Review Environment Variables ⏰ 5 phút

**Backend `.env`:**
```bash
cd backend
cat .env
# Check: DATABASE_URL, JWT_SECRET_KEY, RABBITMQ_HOST
```

**Frontend `.env.local`:**
```bash
cd frontend-new
cat .env.local
# Check: NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## 📝 ƯU TIÊN THẤP (Nice to have)

### 6. Code Quality Check ⏰ 20 phút

**Backend:**
```bash
cd backend
# Check imports, unused code
# Review error handling
# Check SQL injection prevention (SQLAlchemy OK)
```

**Frontend:**
```bash
cd frontend-new
# Check TypeScript errors
npm run build
# Check console warnings
```

---

### 7. Performance Check ⏰ 15 phút

- [ ] Page load times < 2s
- [ ] API response times < 500ms
- [ ] Submission grading < 5s for simple code
- [ ] No memory leaks
- [ ] Proper loading states

---

### 8. Documentation Update ⏰ 10 phút

- [ ] Update README.md với migration steps
- [ ] Add troubleshooting section
- [ ] Update API documentation
- [ ] Add deployment guide

---

## 🎯 HOÀN THÀNH KHI:

### Tối thiểu (Ready for Development):
- ✅ Migration đã chạy
- ✅ All services running
- ✅ Can register/login
- ✅ Can create class
- ✅ Can create problem
- ✅ Can submit code
- ✅ Grading works

### Tốt (Ready for Testing):
- ✅ Tất cả checklist trên
- ✅ No errors in logs
- ✅ All test flows pass
- ✅ Security checks pass

### Xuất sắc (Ready for Production):
- ✅ Tất cả ở trên
- ✅ Performance optimized
- ✅ Documentation complete
- ✅ Backup strategy
- ✅ Monitoring setup
- ✅ HTTPS configured

---

## 📊 TRACKING PROGRESS

### Hiện tại: Development Phase
```
Migration:        [ ] Chưa làm  🔴 CRITICAL
Testing:          [ ] Chưa làm  ⚠️
Logs Check:       [ ] Chưa làm
Security:         [ ] Chưa làm
Code Quality:     [ ] Chưa làm
Documentation:    [X] Đã có docs tốt ✅
```

### Mục tiêu tiếp theo: Testing Phase
```
1. ✅ Tạo migration
2. ✅ Test toàn bộ flows
3. ✅ Fix bugs nếu có
4. ✅ Review logs
5. → Ready for staging
```

---

## 🆘 NẾU GẶP LỖI

### Lỗi Database Connection
```bash
docker-compose logs db
docker-compose restart db
# Check DATABASE_URL in .env
```

### Lỗi Migration
```bash
cd backend
flask db downgrade  # Rollback
flask db upgrade    # Try again
```

### Lỗi RabbitMQ
```bash
docker-compose restart rabbitmq
# Wait 30s for RabbitMQ to start
./scripts/run_worker.sh
```

### Lỗi Frontend Build
```bash
cd frontend-new
rm -rf .next node_modules
pnpm install
pnpm dev
```

### Lỗi Grading
```bash
# Check worker logs
# Check Docker images
docker build -t cpp-grader-env ./grader-engine
# Restart worker
```

---

**Last Updated:** 16/10/2025  
**Next Review:** Sau khi chạy migration và test
