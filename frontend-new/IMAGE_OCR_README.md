# 📷 Image-to-Code OCR Feature

Tính năng trích xuất code từ hình ảnh sử dụng Google Gemini AI - **Frontend Only Implementation**

---

## 🎯 Tính năng

Sinh viên có thể:
- ✅ Upload hình ảnh chứa code (screenshot, ảnh chụp từ giấy, v.v.)
- ✅ AI tự động trích xuất và format code
- ✅ Phát hiện lỗi cú pháp và cảnh báo
- ✅ Review và chỉnh sửa code trước khi submit
- ✅ Hỗ trợ nhiều ngôn ngữ: Python, C++, Java, JavaScript, v.v.

---

## 📋 Cài đặt

### Bước 1: Lấy Gemini API Key

1. Truy cập: https://aistudio.google.com/app/apikey
2. Đăng nhập bằng Google Account
3. Click **"Create API Key"**
4. Copy API key (dạng: `AIzaSy...`)

### Bước 2: Cấu hình Frontend

Mở file `frontend-new/.env.local` và thay thế API key:

```env
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSy_YOUR_ACTUAL_KEY_HERE
```

**⚠️ LƯU Ý:**
- File `.env.local` đã được thêm vào `.gitignore` (không commit lên Git)
- Mỗi developer cần tạo API key riêng
- **KHÔNG** share API key công khai

### Bước 3: Restart Development Server

```bash
cd frontend-new
npm run dev
```

---

## 🚀 Cách sử dụng

### Cho Sinh viên:

1. **Vào trang bài tập** (Problem page)
2. **Click nút "UPLOAD"** ở góc trên bên phải
3. **Chọn tab "📷 Image Upload"**
4. **Upload hình ảnh** bằng cách:
   - Kéo thả (drag & drop) hình ảnh
   - Hoặc click "Choose Image" để browse
5. **Chờ AI xử lý** (2-5 giây)
6. **Review code** được extract:
   - ✅ **Success**: Code hiển thị trong editor
   - ⚠️ **Warnings**: Có lỗi cú pháp - xem chi tiết và sửa
   - ❌ **Error**: Upload thất bại - thử lại với ảnh rõ hơn
7. **Chỉnh sửa code** nếu cần
8. **Submit** như bình thường

---

## 📸 Định dạng hình ảnh hỗ trợ

| Format | Kích thước tối đa | Ghi chú |
|--------|------------------|---------|
| JPEG/JPG | 10MB | ✅ Khuyến nghị |
| PNG | 10MB | ✅ Khuyến nghị |
| GIF | 10MB | ✅ Hỗ trợ |
| WebP | 10MB | ✅ Hỗ trợ |

**💡 Tips để có kết quả tốt nhất:**
- ✅ Sử dụng ảnh rõ nét, đủ sáng
- ✅ Chụp thẳng góc (không xiên)
- ✅ Code nên có font chữ rõ ràng
- ✅ Tránh ảnh mờ, nhòe, tối
- ❌ Không dùng ảnh chụp từ xa

---

## 🔒 Bảo mật & Giới hạn

### Chi phí API:

| Tier | Requests/phút | Requests/ngày | Chi phí |
|------|---------------|---------------|---------|
| **Free** | 15 | 1,500 | $0 (miễn phí) |
| **Paid** | Unlimited | Unlimited | $0.075/1M tokens |

### Giới hạn hiện tại:

- ✅ **Không cần backend** - chạy hoàn toàn trên browser
- ✅ **API key lưu trên client** - mỗi user tự quản lý
- ⚠️ **Không có rate limiting** - developer tự giới hạn
- ⚠️ **Không có caching** - mỗi upload = 1 API call

### Khuyến nghị Production:

Nếu deploy production, nên:
1. ✅ Move API key sang backend (bảo mật hơn)
2. ✅ Thêm rate limiting (VD: 5 lần/ngày/user)
3. ✅ Cache kết quả (tránh gọi API trùng lặp)
4. ✅ Log usage (theo dõi chi phí)

---

## 🛠️ Troubleshooting

### ❌ Lỗi: "GEMINI_API_KEY not configured"

**Nguyên nhân:** Chưa cấu hình API key

**Giải pháp:**
1. Tạo file `.env.local` trong `frontend-new/`
2. Thêm: `NEXT_PUBLIC_GEMINI_API_KEY=your_key_here`
3. Restart dev server

---

### ❌ Lỗi: "Failed to extract code from image"

**Nguyên nhân:** 
- Ảnh quá mờ/tối
- Ảnh không chứa code
- API key không hợp lệ

**Giải pháp:**
1. Thử ảnh rõ hơn
2. Kiểm tra API key còn active không
3. Xem console log để debug

---

### ⚠️ Cảnh báo: "Unbalanced brackets detected"

**Nguyên nhân:** AI phát hiện code thiếu dấu ngoặc

**Giải pháp:**
- Kiểm tra code trong editor
- Sửa lỗi trước khi submit
- Có thể do ảnh bị cắt hoặc mờ

---

## 📊 Tech Stack

```
Frontend (Browser)
    ↓
Image Upload
    ↓
Gemini AI API (Cloud)
    ↓
Extract & Format Code
    ↓
Return to Editor
    ↓
Student Review & Edit
    ↓
Submit (normal flow)
```

**Libraries:**
- `google-genai` API (REST endpoint)
- Next.js 14 (React framework)
- TypeScript
- Tailwind CSS + shadcn/ui

---

## 🎨 UI Components

### Files created:

1. **`lib/gemini-ocr.ts`**
   - Core OCR logic
   - API communication
   - Error handling
   - Code validation

2. **`components/image-to-code-upload.tsx`**
   - Upload UI
   - Preview image
   - Display results
   - Warnings/errors

3. **`app/student/problem/[id]/page.tsx`** (modified)
   - Added "Image Upload" tab
   - Integrated component
   - Auto-populate editor

---

## 📝 Example Workflow

```typescript
// 1. Student uploads image
const file: File = imageInput.files[0]

// 2. Extract code via Gemini API
const result = await extractCodeFromImage(file, { language: 'cpp' })

// 3. Handle result
if (result.success) {
  setCode(result.code)  // Populate editor
  
  if (result.warnings.length > 0) {
    showWarnings(result.warnings)  // Alert user
  }
}
```

---

## 🔮 Future Enhancements

- [ ] Multi-image support (extract multiple files)
- [ ] Batch upload (nhiều ảnh → merge code)
- [ ] OCR history (cache results)
- [ ] Handwriting recognition (nhận diện chữ viết tay)
- [ ] Auto-fix syntax errors
- [ ] Compare: original image vs extracted code

---

## 📞 Support

**Nếu gặp vấn đề:**
1. Check console logs (F12 → Console)
2. Verify API key configuration
3. Test với ảnh mẫu đơn giản
4. Contact: [Your contact info]

---

## ⚖️ License & Usage

- ✅ **Free for educational use**
- ✅ **Open source (modify as needed)**
- ⚠️ **Gemini API usage subject to Google's Terms**
- ⚠️ **Students responsible for code integrity**

**Disclaimer:**
> Tính năng này chỉ là công cụ hỗ trợ. Sinh viên phải tự chịu trách nhiệm về code đã submit. Không được sử dụng để gian lận (copy code người khác).

---

**Made with ❤️ for Code Grader Project**
