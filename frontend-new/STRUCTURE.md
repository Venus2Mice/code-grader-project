# Cấu trúc Frontend - Code Grader Project

## Các file cấu hình chính

- **package.json**: Khai báo dependencies, scripts chạy dev/build/lint của project.

- **next.config.mjs**: Cấu hình Next.js (routes, images, environment variables).

- **tsconfig.json**: Cấu hình TypeScript (paths, compiler options).

- **postcss.config.mjs**: Cấu hình PostCSS cho Tailwind CSS.

- **components.json**: Cấu hình shadcn/ui components.

## Các thư mục chính

- **public/**: Chứa các tài sản tĩnh như favicon, logo, images được serve trực tiếp.

- **app/**: Thư mục chứa toàn bộ mã nguồn của ứng dụng (Next.js App Router).

  - **layout.tsx**: Layout gốc, thiết lập cấu trúc HTML chính của ứng dụng.
  
  - **page.tsx**: Trang chủ/landing page của ứng dụng.
  
  - **globals.css**: CSS toàn cục, khai báo Tailwind directives và styles chung.
  
  - **login/**: Trang đăng nhập cho người dùng.
  
  - **register/**: Trang đăng ký tài khoản mới.
  
  - **student/**: Các trang dành cho sinh viên (dashboard, classes, problems).
  
  - **teacher/**: Các trang dành cho giáo viên (dashboard, quản lý classes, problems).

- **components/**: Chứa các component có khả năng tái sử dụng cao trên toàn ứng dụng.

  - **code-editor.tsx**: Component Monaco Editor để viết/xem code.
  
  - **navbar.tsx**: Thanh điều hướng chính của ứng dụng.
  
  - **create-class-dialog.tsx**: Dialog tạo lớp học mới.
  
  - **join-class-dialog.tsx**: Dialog tham gia lớp học.
  
  - **theme-provider.tsx**: Provider cho dark/light mode.
  
  - **ui/**: Các UI component cơ bản từ shadcn/ui (button, card, dialog, input, table, etc.).

- **hooks/**: Custom React hooks tái sử dụng.

  - **use-toast.ts**: Hook quản lý toast notifications.
  
  - **use-mobile.ts**: Hook phát hiện responsive/mobile view.

- **lib/**: Thư viện và utilities.

  - **utils.ts**: Các hàm tiện ích chung (cn, formatters, validators).
  
  - **mock-data.ts**: Dữ liệu giả cho development/testing.

- **services/**: Layer giao tiếp với backend API.

  - **api.ts**: Axios instance, cấu hình API client và các API calls (auth, classes, submissions).

- **types/**: Định nghĩa TypeScript types và interfaces.

  - **index.ts**: Các types chung cho toàn project (User, Class, Problem, Submission, etc.).

- **styles/**: Chứa các file CSS/SCSS bổ sung.

  - **globals.css**: Global styles và custom CSS.
