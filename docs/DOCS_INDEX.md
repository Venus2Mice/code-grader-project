# 📚 TÀI LIỆU CODE GRADER - INDEX

Chào mừng đến với hệ thống Code Grader! Dưới đây là danh sách tài liệu theo mức độ chi tiết.

---

## 📖 CHỌN TÀI LIỆU PHÙ HỢP

### 🚀 [QUICK_SUMMARY.md](./QUICK_SUMMARY.md) - Bắt đầu tại đây!
**Thời gian đọc: 1 phút**

Dành cho người muốn chạy ngay lập tức:
- ⚡ Lệnh chạy nhanh
- 🌐 Links truy cập
- ✅ Tóm tắt fix lỗi
- 🔧 Troubleshooting 1 dòng

**→ ĐỌC FILE NÀY TRƯỚC NẾU BẠN VỘI!**

---

### 📘 [README.md](./README.md) - Overview Project
**Thời gian đọc: 3-5 phút**

Tổng quan về project:
- ✨ Tính năng của hệ thống
- 🏗️ Kiến trúc tổng thể
- 🛠️ Stack công nghệ
- 🚀 Quick start
- 👥 Thông tin tài khoản test

**→ ĐỌC FILE NÀY ĐỂ HIỂU PROJECT LÀM GÌ**

---

### 📕 [COMPLETE_GUIDE.md](./COMPLETE_GUIDE.md) - Hướng dẫn đầy đủ ⭐
**Thời gian đọc: 15-20 phút**

**FILE QUAN TRỌNG NHẤT!** Tổng hợp tất cả thông tin:
- ❌ Vấn đề đã fix (Docker-in-Docker)
- 🔍 Giải thích kỹ thuật chi tiết
- 📋 Hướng dẫn setup từng bước
- 🧪 Cách test và kiểm tra
- 🔧 Troubleshooting đầy đủ
- 📝 Files đã thay đổi
- 💡 Flow hoạt động hệ thống

**→ ĐỌC FILE NÀY KHI CẦN HIỂU SÂU HOẶC GẶP LỖI**

---

## 🗂️ CẤU TRÚC TÀI LIỆU

```
docs/
├── QUICK_SUMMARY.md       ⚡ Siêu ngắn gọn (1 phút)
├── README.md              📘 Overview (3-5 phút)
├── COMPLETE_GUIDE.md      📕 Đầy đủ nhất (15-20 phút) ⭐
└── DOCS_INDEX.md          📚 File này
```

---

## 🎯 LUỒNG ĐỌC KHUYẾN NGHỊ

### Nếu bạn là người mới:
```
1. QUICK_SUMMARY.md    → Hiểu nhanh và chạy thử
2. README.md           → Hiểu project làm gì
3. COMPLETE_GUIDE.md   → Đọc khi cần hiểu sâu
```

### Nếu gặp lỗi:
```
1. COMPLETE_GUIDE.md > Section 5: Troubleshooting
2. Tìm lỗi cụ thể và xem cách fix
```

### Nếu muốn phát triển:
```
1. COMPLETE_GUIDE.md > Section 2: Giải thích kỹ thuật
2. COMPLETE_GUIDE.md > Section 6: Files đã thay đổi
3. Đọc source code với hiểu biết về kiến trúc
```

---

## 🔗 LINKS NHANH

### Services
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- RabbitMQ Management: http://localhost:15672

### Tài khoản Test
- Teacher: `teacher.dev@example.com` / `password`
- Student: `student.dev@example.com` / `password`

### Scripts
```bash
./setup.sh         # Setup tự động toàn bộ
./run_worker.sh    # Chỉ chạy worker
```

---

## 💡 TIP

**Bạn đang ở đâu trong journey?**

| Tình huống | Đọc file |
|------------|----------|
| 🆕 Lần đầu sử dụng | QUICK_SUMMARY.md |
| 🤔 Muốn hiểu project | README.md |
| 🔧 Đang gặp lỗi | COMPLETE_GUIDE.md (Section 5) |
| 👨‍💻 Muốn phát triển | COMPLETE_GUIDE.md (Section 2, 6) |
| 📚 Muốn hiểu hết | Đọc cả 3 file theo thứ tự |

---

## 📞 HỖ TRỢ

Nếu tài liệu không giải quyết được vấn đề của bạn:

1. ✅ Kiểm tra lại [COMPLETE_GUIDE.md > Troubleshooting](./COMPLETE_GUIDE.md#5-troubleshooting)
2. ✅ Xem logs: `docker logs code-grader-project-backend-1`
3. ✅ Check services: `docker ps`
4. ✅ Restart: `docker-compose restart`
5. ✅ Clean start: `docker-compose down -v && ./setup.sh`

---

**Happy Coding! 🎉**

*Tài liệu được tạo: October 16, 2025*  
*Version: 2.0 (Worker Standalone)*
