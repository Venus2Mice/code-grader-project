# 🚀 Quick Start: Image-to-Code OCR

## ⚡ Cài đặt nhanh (5 phút)

### 1️⃣ Lấy API Key
```bash
# Truy cập: https://aistudio.google.com/app/apikey
# Click "Create API Key" → Copy key
```

### 2️⃣ Cấu hình
```bash
cd frontend-new

# Tạo/Mở file .env.local
# Thêm dòng sau (thay YOUR_KEY):
echo "NEXT_PUBLIC_GEMINI_API_KEY=AIzaSy_YOUR_KEY_HERE" > .env.local
```

### 3️⃣ Chạy thử
```bash
npm run dev
# Mở: http://localhost:3000
# Login → Vào bài tập → Click UPLOAD → Tab "📷 Image Upload"
```

---

## ✅ Checklist

- [ ] API key đã lấy từ Google AI Studio
- [ ] File `.env.local` đã tạo và cấu hình
- [ ] Dev server đã restart
- [ ] Test upload 1 ảnh code thử nghiệm

---

## 🎯 Demo Flow

```
1. Student clicks "UPLOAD" button
2. Switch to "📷 Image Upload" tab  
3. Upload/drag image containing code
4. Wait 2-5 seconds
5. Code appears in editor
6. Review & edit if needed
7. Submit normally
```

---

## 🐛 Common Issues

**"API key not found"**
→ Kiểm tra file `.env.local` có đúng tên biến: `NEXT_PUBLIC_GEMINI_API_KEY`

**"Failed to extract"**
→ Thử ảnh rõ hơn, hoặc API key hết quota

**Code không chính xác**
→ Normal! AI không 100% perfect, sinh viên cần review

---

## 📁 Files đã tạo

```
frontend-new/
├── lib/
│   └── gemini-ocr.ts              ← Core OCR logic
├── components/
│   └── image-to-code-upload.tsx   ← Upload UI component
├── app/student/problem/[id]/
│   └── page.tsx                   ← Modified (added tab)
├── .env.local                     ← API key config
└── IMAGE_OCR_README.md            ← Full documentation
```

---

## 🎉 That's it!

Tính năng đã sẵn sàng sử dụng!

**Test ngay:**
1. Chụp ảnh code từ màn hình
2. Upload lên system
3. Xem AI extract thế nào
4. Sửa nếu cần → Submit!

**Lưu ý:** Always review code before submitting! 🔍
