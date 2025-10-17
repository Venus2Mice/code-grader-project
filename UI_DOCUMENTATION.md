# 7. Giao diện người dùng (User Interface)

## 7.1. Thiết kế UI/UX

### 7.1.1. Nguyên tắc thiết kế

Giao diện được thiết kế theo các nguyên tắc:
- **Đơn giản và trực quan**: Dễ sử dụng cho cả giáo viên và sinh viên
- **Responsive**: Hoạt động tốt trên desktop, tablet và mobile
- **Consistent**: Thống nhất về màu sắc, font chữ, spacing
- **Accessible**: Hỗ trợ người dùng khuyết tật (WCAG 2.1)

### 7.1.2. Design System

**Framework & Libraries:**
- **Next.js 14**: React framework với App Router
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Headless UI components (accessible & customizable)
- **shadcn/ui**: Pre-built component library
- **Lucide Icons**: Modern icon set

**Color Palette:**
- Primary: Blue (#3B82F6) - Buttons, links, accents
- Success: Green (#10B981) - Passed tests, correct answers
- Error: Red (#EF4444) - Failed tests, errors
- Warning: Yellow (#F59E0B) - Pending, warnings
- Neutral: Gray (#6B7280) - Text, borders

**Typography:**
- Font family: Inter (sans-serif)
- Headings: Bold, sizes 24px-36px
- Body text: Regular, 14px-16px
- Code: Monospace (JetBrains Mono)

---

## 7.2. Các màn hình chính

### 7.2.1. Authentication Pages

#### **Login Page** (`/login`)
**Chức năng:**
- Đăng nhập bằng email/password
- Hiển thị lỗi nếu credentials sai
- Link đến trang Register

**Thành phần:**
- Email input field
- Password input field (with show/hide toggle)
- "Remember me" checkbox
- Login button
- "Don't have an account?" link

**Screenshot placeholder:**
```
[Chèn ảnh: Login page với form đăng nhập]
```

---

#### **Register Page** (`/register`)
**Chức năng:**
- Đăng ký tài khoản mới
- Chọn role: Student hoặc Teacher
- Validation: email format, password strength

**Thành phần:**
- Full name input
- Email input
- Password input (với strength indicator)
- Role selector (Student/Teacher radio buttons)
- Register button
- "Already have an account?" link

**Screenshot placeholder:**
```
[Chèn ảnh: Register page với form đăng ký]
```

---

### 7.2.2. Teacher Dashboard

#### **Classes Overview** (`/teacher/dashboard`)
**Chức năng:**
- Hiển thị danh sách classes đang giảng dạy
- Thống kê: số học sinh, số bài tập, trạng thái
- Tạo class mới (Create Class button)

**Thành phần:**
- Header với welcome message
- "Create New Class" button
- Grid/List view của classes
- Mỗi class card hiển thị:
  - Tên lớp và course code
  - Số học sinh enrolled
  - Số problems đã tạo
  - Quick actions: View, Edit, Delete

**Screenshot placeholder:**
```
[Chèn ảnh: Teacher dashboard với danh sách classes]
```

---

#### **Class Detail - Teacher View** (`/teacher/class/[id]`)
**Chức năng:**
- Xem chi tiết class: danh sách students, problems
- Quản lý: thêm/xóa problems, xem submissions
- Copy invite code để chia sẻ với students

**Thành phần:**
- **Header section**:
  - Class name và course code
  - Invite code (với copy button)
  - "Create Problem" button
- **Tabs navigation**:
  - Problems tab
  - Students tab
  - Statistics tab
- **Problems list**: Table với columns:
  - Problem title
  - Difficulty badge (Easy/Medium/Hard)
  - Submission count
  - Average score
  - Actions (View, Edit, Delete)
- **Students list**: Table với columns:
  - Student name
  - Email
  - Enrolled date
  - Progress (problems solved)

**Screenshot placeholder:**
```
[Chèn ảnh: Class detail - teacher view với tabs]
```

---

#### **Create/Edit Problem** (`/teacher/problem/create`)
**Chức năng:**
- Tạo hoặc chỉnh sửa problem
- Nhập thông tin: title, description, difficulty
- Chọn grading mode: STDIO hoặc Function
- Thêm test cases với điểm số

**Thành phần:**
- **Basic info section**:
  - Title input
  - Description rich text editor
  - Difficulty selector (dropdown)
  - Grading mode selector (radio: STDIO/Function)
- **Function signature** (nếu mode = Function):
  - Text input cho function definition
- **Test cases section**:
  - "Add Test Case" button
  - List of test cases, mỗi cái có:
    - Input textarea
    - Expected output textarea
    - Points input (number)
    - Is hidden checkbox
    - Delete button
- **Limits section**:
  - Time limit (ms)
  - Memory limit (KB)
- **Action buttons**:
  - Save as Draft
  - Publish
  - Cancel

**Screenshot placeholder:**
```
[Chèn ảnh: Create problem form]
[Chèn ảnh: Test cases section]
```

---

#### **Submissions View - Teacher** (`/teacher/problem/[id]/submissions`)
**Chức năng:**
- Xem tất cả submissions của students cho một problem
- Filter theo student, status, score
- View code của từng submission

**Thành phần:**
- **Filter bar**:
  - Search by student name
  - Filter by status (All/Accepted/Failed/Pending)
  - Sort by date/score
- **Submissions table**:
  - Student name
  - Submitted at (timestamp)
  - Status badge (Accepted/Wrong Answer/Error)
  - Score (percentage)
  - Test results (e.g., "8/10 passed")
  - "View Code" button
- **Code modal**: Popup hiển thị source code với syntax highlighting

**Screenshot placeholder:**
```
[Chèn ảnh: Submissions table - teacher view]
```

---

### 7.2.3. Student Dashboard

#### **My Classes** (`/student/dashboard`)
**Chức năng:**
- Hiển thị classes đã tham gia
- Thống kê progress: problems solved, pending
- Join class mới (Join Class button)

**Thành phần:**
- Header với welcome message
- "Join Class" button (opens dialog)
- Grid view của classes
- Mỗi class card hiển thị:
  - Class name và teacher name
  - Progress bar (completed/total problems)
  - "X problems to do"
  - "View Problems" button

**Screenshot placeholder:**
```
[Chèn ảnh: Student dashboard với class cards]
```

---

#### **Join Class Dialog**
**Chức năng:**
- Popup để nhập invite code
- Tham gia class

**Thành phần:**
- Dialog overlay
- Title: "Join a Class"
- Invite code input field
- "Join" button
- "Cancel" button

**Screenshot placeholder:**
```
[Chèn ảnh: Join class dialog]
```

---

#### **Problems List - Student View** (`/student/class/[id]/problems`)
**Chức năng:**
- Xem danh sách problems trong class
- Hiển thị trạng thái: Not started, Failed, Accepted
- Click vào problem để làm bài

**Thành phần:**
- Class header (name, description)
- Problems table/grid:
  - Problem title
  - Difficulty badge
  - Status badge:
    - 🔴 Not Started (gray)
    - 🟡 Attempted (yellow)
    - 🟢 Accepted (green)
  - Best score (if attempted)
  - Attempts count
  - "Solve" button

**Screenshot placeholder:**
```
[Chèn ảnh: Problems list - student view]
```

---

#### **Problem Detail & Code Editor** (`/student/problem/[id]`)
**Chức năng:**
- Xem đề bài chi tiết
- Viết code trong Monaco Editor
- Submit code hoặc Run test
- Xem kết quả chấm

**Thành phần:**

**Layout (Split view):**
- **Left panel (Problem description)**:
  - Problem title và difficulty
  - Description (formatted markdown)
  - Function signature (nếu mode = Function)
  - Example input/output
  - Constraints (time limit, memory limit)
  - Test cases (visible ones)

- **Right panel (Code editor)**:
  - Language selector (Python/C++/Java)
  - Monaco Editor với:
    - Syntax highlighting
    - Auto-completion
    - Line numbers
    - Theme toggle (light/dark)
  - Action buttons:
    - "Run Code" (test với visible test cases)
    - "Submit" (chấm chính thức)
  - Console output area:
    - Hiển thị kết quả run/submit
    - Test cases results
    - Errors/warnings

**Screenshot placeholder:**
```
[Chèn ảnh: Problem detail với split view - description bên trái, editor bên phải]
[Chèn ảnh: Code editor với syntax highlighting]
```

---

#### **Submission Results** (`/student/problem/[id]` - sau khi submit)
**Chức năng:**
- Hiển thị kết quả chấm chi tiết
- Score, test cases passed/failed
- Execution time, memory used

**Thành phần:**
- **Results header**:
  - Status badge (Accepted/Wrong Answer/Error)
  - Score (large, prominent)
  - "X/Y tests passed"
- **Test cases results table**:
  - Test case ID
  - Status (Passed ✅ / Failed ❌)
  - Input (hidden nếu test case hidden)
  - Expected output
  - Your output
  - Execution time
  - Memory used
  - Error message (nếu có)
- **Actions**:
  - "Submit Again" button
  - "View All Submissions" button

**Screenshot placeholder:**
```
[Chèn ảnh: Submission results với score và test cases]
[Chèn ảnh: Test cases table chi tiết]
```

---

#### **My Submissions History** (`/student/problem/[id]/submissions`)
**Chức năng:**
- Xem lịch sử submissions cho một problem
- So sánh các lần submit

**Thành phần:**
- Timeline/List view của submissions:
  - Timestamp
  - Score
  - Status
  - Test results summary
  - "View Details" button

**Screenshot placeholder:**
```
[Chèn ảnh: Submissions history timeline]
```

---

### 7.2.4. Shared Components

#### **Navbar**
**Chức năng:**
- Navigation chính
- User menu với logout

**Thành phần:**
- Logo/Brand name
- Navigation links (tùy role):
  - Teacher: Dashboard, Classes
  - Student: Dashboard, My Classes
- User avatar dropdown:
  - Profile
  - Settings
  - Logout

**Screenshot placeholder:**
```
[Chèn ảnh: Navbar với navigation]
```

---

#### **Loading States**
**Chức năng:**
- Hiển thị khi đang load data hoặc chấm bài

**Thành phần:**
- Skeleton loaders cho tables, cards
- Spinner cho buttons
- Progress bar cho submissions đang chấm

**Screenshot placeholder:**
```
[Chèn ảnh: Loading skeleton/spinner]
```

---

#### **Error States**
**Chức năng:**
- Hiển thị lỗi khi có vấn đề

**Thành phần:**
- Error alert boxes
- Empty states (no data)
- 404 page

**Screenshot placeholder:**
```
[Chèn ảnh: Error message/empty state]
```

---

## 7.3. Responsive Design

### 7.3.1. Breakpoints
```css
/* Mobile */
@media (max-width: 640px) { ... }

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) { ... }

/* Desktop */
@media (min-width: 1025px) { ... }
```

### 7.3.2. Adaptive Layouts

**Desktop (≥1024px):**
- Split view cho problem page (description | editor)
- Tables với tất cả columns
- Sidebar navigation

**Tablet (641px - 1024px):**
- Tabs thay vì split view
- Tables với scroll horizontal
- Collapsed sidebar

**Mobile (≤640px):**
- Stack layout (vertical)
- Cards thay vì tables
- Bottom navigation
- Hamburger menu

**Screenshot placeholder:**
```
[Chèn ảnh: Responsive views - Desktop, Tablet, Mobile]
```

---

## 7.4. User Flows (Các luồng chính)

### 7.4.1. Teacher Flow: Tạo Problem

```
1. Login → Dashboard
2. Click vào Class → Class Detail
3. Click "Create Problem" button
4. Điền form:
   - Title, Description, Difficulty
   - Chọn grading mode
   - Thêm test cases
5. Click "Publish"
6. Problem xuất hiện trong class
```

**Screenshot placeholder:**
```
[Chèn ảnh: Flow diagram hoặc series of screenshots]
```

---

### 7.4.2. Student Flow: Làm bài và Submit

```
1. Login → Dashboard
2. Click vào Class → Problems List
3. Click "Solve" trên một problem
4. Đọc đề → Viết code trong editor
5. Click "Run Code" để test
6. Xem output → Fix bugs
7. Click "Submit" để chấm chính thức
8. Xem results → Score và test cases
```

**Screenshot placeholder:**
```
[Chèn ảnh: Flow diagram hoặc series of screenshots]
```

---

## 7.5. Accessibility Features

### 7.5.1. Keyboard Navigation
- Tab navigation cho tất cả interactive elements
- Enter/Space để activate buttons
- Escape để close modals/dialogs
- Arrow keys cho dropdowns

### 7.5.2. Screen Reader Support
- Semantic HTML (header, nav, main, section)
- ARIA labels cho icons và buttons
- Alt text cho images
- Focus indicators rõ ràng

### 7.5.3. Color Contrast
- Đạt chuẩn WCAG AA (tỉ lệ tương phản ≥4.5:1)
- Không dựa hoàn toàn vào màu sắc để truyền đạt thông tin
- Icons kèm text labels

---

## 7.6. Performance Optimization

### 7.6.1. Code Splitting
- Next.js automatic code splitting
- Lazy loading cho Monaco Editor
- Dynamic imports cho heavy components

### 7.6.2. Image Optimization
- Next.js Image component với auto-optimization
- WebP format với fallback
- Lazy loading images

### 7.6.3. Caching
- Static pages cached at CDN
- API responses cached với SWR
- Service worker cho offline support (future)

---

## 7.7. Tóm tắt

**Highlights:**
- ✅ **Modern UI**: Sử dụng Next.js 14, Tailwind CSS, Radix UI
- ✅ **Role-based UI**: Giao diện khác nhau cho Teacher và Student
- ✅ **Code Editor**: Monaco Editor với syntax highlighting và auto-complete
- ✅ **Responsive**: Hoạt động tốt trên mọi thiết bị
- ✅ **Accessible**: Tuân thủ WCAG 2.1 guidelines
- ✅ **Real-time feedback**: Hiển thị kết quả chấm ngay lập tức
- ✅ **Intuitive UX**: Flow đơn giản, dễ hiểu cho người dùng

**Màn hình chính:**
1. Authentication (Login/Register)
2. Teacher: Dashboard, Class Management, Problem Creation, Submissions Review
3. Student: Dashboard, Join Class, Problem Solving, Code Editor, Results

**Design principles:**
- Simplicity over complexity
- Consistency in UI patterns
- Fast feedback loops
- Clear visual hierarchy

---

## Hướng dẫn chèn ảnh

**Vị trí cần chèn screenshots:**

1. ✏️ Login page
2. ✏️ Register page
3. ✏️ Teacher dashboard
4. ✏️ Class detail - teacher view
5. ✏️ Create problem form
6. ✏️ Test cases section
7. ✏️ Submissions table - teacher
8. ✏️ Student dashboard
9. ✏️ Join class dialog
10. ✏️ Problems list - student
11. ✏️ Problem detail split view
12. ✏️ Code editor
13. ✏️ Submission results
14. ✏️ Test cases results table
15. ✏️ Submissions history
16. ✏️ Navbar
17. ✏️ Loading states
18. ✏️ Error states
19. ✏️ Responsive views (desktop/tablet/mobile)
20. ✏️ User flow diagrams

**Khi chèn ảnh vào Word:**
1. Tìm placeholder `[Chèn ảnh: ...]`
2. Xóa text placeholder
3. Insert → Pictures → chọn screenshot
4. Add caption (Insert → Caption)
5. Căn giữa ảnh và điều chỉnh kích thước phù hợp

---

*Tài liệu được tạo ngày: 17/10/2025*  
*Dự án: Code Grader System*  
*Phần: Giao diện người dùng (UI)*
