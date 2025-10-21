# Frontend Architecture Documentation

## 📋 Mục Lục

1. [Tổng Quan](#tổng-quan)
2. [Tech Stack](#tech-stack)
3. [Cấu Trúc Thư Mục](#cấu-trúc-thư-mục)
4. [Design System](#design-system)
5. [State Management](#state-management)
6. [API Integration](#api-integration)
7. [Routing](#routing)
8. [Best Practices](#best-practices)
9. [Performance Optimization](#performance-optimization)
10. [Testing Strategy](#testing-strategy)

---

## 🎯 Tổng Quan

Frontend của Code Grader Project được xây dựng với **Next.js 15** sử dụng App Router, TypeScript, và Neobrutalism design system. Dự án hướng đến việc tạo ra trải nghiệm người dùng tuyệt vời cho cả giáo viên và học sinh trong việc quản lý và chấm bài tập lập trình.

### Mục Tiêu Kiến Trúc

- ✅ **Type Safety**: TypeScript cho toàn bộ codebase
- ✅ **Component Reusability**: shadcn/ui + custom components
- ✅ **Performance**: Code splitting, lazy loading, optimized bundles
- ✅ **Developer Experience**: Hot reload, clear structure, comprehensive types
- ✅ **User Experience**: Fast loading, smooth transitions, responsive design

---

## 🛠️ Tech Stack

### Core Technologies

- **Framework**: Next.js 15.1.6 (App Router)
- **Language**: TypeScript 5.9.3
- **Package Manager**: pnpm

### UI & Styling

- **CSS Framework**: Tailwind CSS 4.1.14
- **Design System**: Neobrutalism (custom)
- **Component Library**: 
  - Radix UI (primitives)
  - shadcn/ui (built on top of Radix)
- **Icons**: Lucide React 0.469.0

### Code Editor

- **Editor**: Monaco Editor (@monaco-editor/react)
- **Syntax Highlighting**: Built-in Monaco themes
- **Language Support**: C++, Python, Java

### Additional Libraries

- **Charts**: Recharts 2.15.4
- **Carousel**: Embla Carousel React 8.5.1
- **Date Handling**: date-fns 4.1.0
- **AI/OCR**: @google/generative-ai 0.21.0

---

## 📁 Cấu Trúc Thư Mục

```
frontend-new/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   ├── globals.css              # Global styles
│   ├── login/                   # Login page
│   ├── register/                # Register page
│   ├── student/                 # Student routes
│   │   ├── dashboard/           # Student dashboard
│   │   ├── class/[id]/          # Class detail
│   │   └── problem/[id]/        # Problem solving
│   └── teacher/                 # Teacher routes
│       ├── dashboard/           # Teacher dashboard
│       ├── class/[id]/          # Class management
│       └── problem/[id]/        # Problem creation/editing
│
├── components/                   # React components
│   ├── ui/                      # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── skeleton.tsx
│   │   ├── loading-skeletons.tsx
│   │   └── ...
│   ├── problem/                 # Problem-specific components
│   │   ├── ProblemDescription.tsx
│   │   ├── TestResultsPanel.tsx
│   │   ├── ErrorModal.tsx
│   │   └── teacher/
│   ├── code-editor.tsx          # Monaco Editor wrapper
│   ├── navbar.tsx               # Navigation bar
│   ├── theme-provider.tsx       # Dark mode provider
│   └── ...
│
├── hooks/                        # Custom React hooks
│   ├── use-toast.ts             # Toast notifications
│   ├── use-mobile.ts            # Mobile detection
│   └── problem/                 # Problem-related hooks
│       ├── useCodeAnalysis.ts   # C++ code analysis
│       └── useRuntimeErrorAnalysis.ts  # Runtime error detection
│
├── lib/                          # Utilities & helpers
│   ├── utils.ts                 # General utilities (cn, etc.)
│   ├── api-client.ts            # ⭐ Centralized API client
│   ├── problemUtils.ts          # Problem utilities
│   ├── teacherUtils.tsx         # Teacher utilities
│   ├── gemini-ocr.ts            # OCR functionality
│   └── mock-data.ts             # Mock data for development
│
├── types/                        # TypeScript type definitions
│   ├── api.ts                   # ⭐ API response types
│   ├── problem.ts               # Problem types (legacy)
│   └── ...
│
├── services/                     # API service layer
│   ├── authService.ts
│   ├── classService.ts
│   ├── problemService.ts
│   └── submissionService.ts
│
├── styles/                       # Additional styles
│   └── ...
│
├── public/                       # Static assets
│   ├── images/
│   └── ...
│
└── next.config.mjs              # Next.js configuration
```

---

## 🎨 Design System

### Neobrutalism Design

Dự án sử dụng **Neobrutalism** (hay Brutalism 2.0) - một phong cách thiết kế đặc trưng với:

#### Đặc Điểm Chính

1. **Border dày (4px)**
   ```tsx
   className="border-4 border-border"
   ```

2. **Shadow hiệu ứng 3D**
   ```tsx
   hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
   ```

3. **Màu sắc nổi bật**
   - Primary: Bold, high contrast
   - Secondary: Complementary colors
   - Accent: Attention-grabbing

4. **Typography**
   - Font weights: `font-black`, `font-bold`
   - Clear hierarchy
   - Readable sizes

5. **Transitions**
   ```tsx
   className="transition-all hover:-translate-y-1"
   ```

### Color Palette

Defined in `app/globals.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --primary: 0 0% 9%;
  --primary-foreground: 0 0% 98%;
  --border: 0 0% 89.8%;
  --accent: 0 0% 96.1%;
  /* ... more colors */
}

.dark {
  --background: 0 0% 3.9%;
  --foreground: 0 0% 98%;
  /* ... dark mode colors */
}
```

### Component Variants

Các component từ shadcn/ui hỗ trợ variants:

```tsx
<Button variant="default" | "destructive" | "outline" | "ghost" | "link">
<Card variant="default" | "outline">
<Badge variant="default" | "secondary" | "destructive" | "outline">
```

---

## 🔄 State Management

### Local State (React Hooks)

Sử dụng built-in hooks cho component state:

```tsx
const [isLoading, setIsLoading] = useState(false)
const [data, setData] = useState<Problem | null>(null)
const [error, setError] = useState<string | null>(null)
```

### Custom Hooks

#### 1. **useCodeAnalysis**

Phân tích code C++ để phát hiện các vấn đề:

```tsx
import { useCodeAnalysis } from "@/hooks/problem/useCodeAnalysis"

const { analysis, hasMain, hasFunctions } = useCodeAnalysis(code)
```

**Features**:
- Detect missing `main()` function
- Identify common C++ errors
- Provide Vietnamese suggestions

#### 2. **useRuntimeErrorAnalysis**

Phân tích lỗi runtime chi tiết:

```tsx
import { useRuntimeErrorAnalysis } from "@/hooks/problem/useRuntimeErrorAnalysis"

const { errorType, suggestions } = useRuntimeErrorAnalysis(
  errorCode,
  errorMessage
)
```

**Features**:
- Parse exit codes (136, 139, 143, etc.)
- Provide detailed Vietnamese explanations
- Suggest fixes with code examples

#### 3. **useToast**

Toast notifications:

```tsx
import { useToast } from "@/hooks/use-toast"

const { toast } = useToast()

toast({
  variant: "destructive",
  title: "Lỗi",
  description: "Có lỗi xảy ra"
})
```

### Global State

Hiện tại không sử dụng global state management library (Redux, Zustand). Authentication state được lưu trong `localStorage`:

```tsx
// Login
localStorage.setItem("token", token)
localStorage.setItem("user", JSON.stringify(user))

// Check auth
const token = localStorage.getItem("token")
```

**Future Consideration**: Có thể thêm Context API hoặc Zustand nếu cần.

---

## 🌐 API Integration

### Centralized API Client

**File**: `lib/api-client.ts`

#### Features

✅ **Error Handling**: Automatic error detection và toast notifications  
✅ **Retry Logic**: Exponential backoff cho failed requests  
✅ **Authentication**: Auto-inject Bearer token  
✅ **Type Safety**: Full TypeScript support  
✅ **Timeout**: Configurable request timeout  

#### Usage

```tsx
import { api } from "@/lib/api-client"
import type { Problem, APIResponse } from "@/types/api"

// GET request
const response = await api.get<Problem[]>("/api/problems")
console.log(response.data) // Problem[]

// POST request
const response = await api.post<LoginResponse>("/api/auth/login", {
  email: "user@example.com",
  password: "password123"
})

// Skip error toast for custom handling
try {
  const response = await api.get("/api/data", { skipErrorToast: true })
} catch (error) {
  // Handle manually
}

// Custom retry count
const response = await api.post("/api/submit", data, { retries: 5 })
```

#### Error Handling

API client tự động hiển thị toast với messages tiếng Việt:

| Status Code | Title | Description |
|-------------|-------|-------------|
| 400 | Yêu cầu không hợp lệ | ... |
| 401 | Chưa đăng nhập | Vui lòng đăng nhập để tiếp tục |
| 403 | Không có quyền | Bạn không có quyền thực hiện... |
| 404 | Không tìm thấy | Tài nguyên không tồn tại |
| 429 | Quá nhiều yêu cầu | Vui lòng thử lại sau ít phút |
| 500 | Lỗi máy chủ | Đã xảy ra lỗi... |
| 503 | Dịch vụ tạm ngưng | Hệ thống đang bảo trì... |

### API Types

**File**: `types/api.ts`

Chuẩn hóa tất cả API response types:

```tsx
// User & Auth
export interface User { ... }
export interface LoginResponse { ... }

// Classes
export interface Class { ... }
export interface ClassMember { ... }

// Problems
export interface Problem { ... }
export interface TestCase { ... }

// Submissions
export interface Submission { ... }
export interface SubmissionResult { ... }

// Type Guards
export function isAPIError(error: any): error is APIError
export function isProblem(obj: any): obj is Problem
```

### Service Layer

Tổ chức API calls theo domain:

**Example**: `services/problemService.ts`

```tsx
import { api } from "@/lib/api-client"
import type { Problem, CreateProblemRequest } from "@/types/api"

export const problemService = {
  getAll: async (classId?: number) => {
    const endpoint = classId 
      ? `/api/classes/${classId}/problems`
      : "/api/problems"
    return api.get<Problem[]>(endpoint)
  },

  getById: async (id: number) => {
    return api.get<Problem>(`/api/problems/${id}`)
  },

  create: async (data: CreateProblemRequest) => {
    return api.post<Problem>("/api/problems", data)
  },

  update: async (id: number, data: Partial<Problem>) => {
    return api.put<Problem>(`/api/problems/${id}`, data)
  },

  delete: async (id: number) => {
    return api.delete(`/api/problems/${id}`)
  }
}
```

---

## 🗺️ Routing

### App Router Structure

Next.js 15 App Router với file-based routing:

```
app/
├── page.tsx                    # / (Landing page)
├── login/page.tsx              # /login
├── register/page.tsx           # /register
├── student/
│   ├── dashboard/page.tsx      # /student/dashboard
│   ├── class/[id]/page.tsx     # /student/class/:id
│   └── problem/[id]/page.tsx   # /student/problem/:id
└── teacher/
    ├── dashboard/page.tsx      # /teacher/dashboard
    ├── class/[id]/page.tsx     # /teacher/class/:id
    └── problem/[id]/page.tsx   # /teacher/problem/:id
```

### Dynamic Routes

```tsx
// app/student/class/[id]/page.tsx
export default function ClassPage({ params }: { params: { id: string } }) {
  const classId = parseInt(params.id)
  // ...
}
```

### Navigation

```tsx
import Link from "next/link"
import { useRouter } from "next/navigation"

// Link component
<Link href="/student/dashboard">Dashboard</Link>

// Programmatic navigation
const router = useRouter()
router.push("/student/class/123")
```

### Protected Routes

Implement auth check in page components:

```tsx
"use client"

export default function ProtectedPage() {
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
    }
  }, [])
  
  // ...
}
```

**Future**: Tạo middleware để protect routes globally.

---

## ✨ Best Practices

### 1. Component Organization

#### ✅ DO: Small, focused components

```tsx
// ✅ Good
function SubmitButton({ onClick, isLoading }) {
  return (
    <Button onClick={onClick} disabled={isLoading}>
      {isLoading ? "Đang nộp..." : "Nộp bài"}
    </Button>
  )
}
```

#### ❌ DON'T: Huge multi-purpose components

### 2. Type Safety

#### ✅ DO: Use proper types from `types/api.ts`

```tsx
import type { Problem, Submission } from "@/types/api"

const problem: Problem = await api.get<Problem>(`/api/problems/${id}`)
```

#### ❌ DON'T: Use `any` or excessive optional chaining

```tsx
// ❌ Bad
const score = submission?.score ?? submission?.points ?? 0
```

### 3. Error Handling

#### ✅ DO: Use api-client for consistent errors

```tsx
try {
  const response = await api.post("/api/submit", data)
  toast({ title: "Thành công!" })
} catch (error) {
  // Error toast already shown by api-client
}
```

#### ❌ DON'T: Inconsistent error handling

### 4. Loading States

#### ✅ DO: Use skeleton components

```tsx
import { ProblemGridSkeleton } from "@/components/ui/loading-skeletons"

{isLoading ? (
  <ProblemGridSkeleton count={6} />
) : (
  <ProblemGrid problems={problems} />
)}
```

#### ❌ DON'T: Generic "Loading..." text

### 5. Code Style

#### ✅ DO: Consistent naming

- Components: PascalCase (`ProblemCard.tsx`)
- Hooks: camelCase with "use" prefix (`useCodeAnalysis.ts`)
- Utils: camelCase (`problemUtils.ts`)
- Types: PascalCase (`Problem`, `Submission`)

#### ✅ DO: Use Tailwind utilities

```tsx
<div className="flex items-center gap-4">
```

#### ❌ DON'T: Inline styles

```tsx
// ❌ Bad
<div style={{ display: "flex", gap: "16px" }}>
```

---

## ⚡ Performance Optimization

### 1. Code Splitting

**Configured in** `next.config.mjs`:

```js
webpack: (config) => {
  config.optimization.splitChunks.cacheGroups = {
    monaco: {
      test: /[\\/]node_modules[\\/](@monaco-editor)[\\/]/,
      name: "monaco-editor",
      priority: 40,
    },
    radix: {
      test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
      name: "radix-ui",
      priority: 30,
    },
    react: {
      test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
      name: "react-vendor",
      priority: 20,
    }
  }
}
```

**Result**: Separate chunks cho heavy libraries.

### 2. Lazy Loading

```tsx
import dynamic from "next/dynamic"

const CodeEditor = dynamic(() => import("@/components/code-editor"), {
  loading: () => <CodeEditorSkeleton />,
  ssr: false // Monaco doesn't support SSR
})
```

### 3. Image Optimization

```tsx
import Image from "next/image"

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={50}
  priority // For above-the-fold images
/>
```

### 4. Memoization

```tsx
import { useMemo, useCallback } from "react"

const sortedProblems = useMemo(() => {
  return problems.sort((a, b) => a.title.localeCompare(b.title))
}, [problems])

const handleSubmit = useCallback(() => {
  // ...
}, [dependencies])
```

### 5. Bundle Analysis

```bash
# Analyze bundle size
pnpm build
# Check .next/analyze/client.html
```

---

## 🧪 Testing Strategy

### Current State

⚠️ **No tests currently implemented**

### Recommended Testing Approach

#### 1. Unit Tests (Jest + React Testing Library)

```tsx
// components/__tests__/Button.test.tsx
import { render, screen, fireEvent } from "@testing-library/react"
import { Button } from "@/components/ui/button"

describe("Button", () => {
  it("renders correctly", () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText("Click me")).toBeInTheDocument()
  })

  it("handles click events", () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    fireEvent.click(screen.getByText("Click"))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

#### 2. Integration Tests

Test API integration với mock service:

```tsx
// services/__tests__/problemService.test.ts
import { problemService } from "@/services/problemService"

jest.mock("@/lib/api-client")

describe("problemService", () => {
  it("fetches all problems", async () => {
    const mockProblems = [{ id: 1, title: "Test" }]
    api.get.mockResolvedValue({ data: mockProblems })
    
    const result = await problemService.getAll()
    expect(result.data).toEqual(mockProblems)
  })
})
```

#### 3. E2E Tests (Playwright / Cypress)

```tsx
// e2e/problem-submission.spec.ts
test("student can submit solution", async ({ page }) => {
  await page.goto("/student/problem/1")
  await page.fill("[data-testid='code-editor']", "int main() { ... }")
  await page.click("button:text('Nộp bài')")
  await expect(page.locator(".toast")).toContainText("Nộp thành công")
})
```

### Testing Setup

**Install dependencies**:

```bash
pnpm add -D @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom
pnpm add -D @playwright/test # For E2E
```

**jest.config.js**:

```js
module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1"
  }
}
```

---

## 📚 Additional Resources

### Documentation

- [Next.js 15 Docs](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/)
- [shadcn/ui](https://ui.shadcn.com/)

### Internal Docs

- [Backend Documentation](../docs/BACKEND_DOCUMENTATION.md)
- [Installation Guide](../docs/INSTALLATION.md)
- [Worker Documentation](../docs/WORKER_DOCUMENTATION.md)

### Code Examples

- API Client: `lib/api-client.ts`
- Custom Hooks: `hooks/problem/useCodeAnalysis.ts`
- Skeleton Components: `components/ui/loading-skeletons.tsx`
- Type Definitions: `types/api.ts`

---

## 🔄 Migration Guide

### Migrating to New API Client

**Before**:

```tsx
const response = await fetch(`${API_URL}/api/problems/${id}`, {
  headers: {
    Authorization: `Bearer ${token}`
  }
})
const data = await response.json()
```

**After**:

```tsx
import { api } from "@/lib/api-client"
import type { Problem } from "@/types/api"

const response = await api.get<Problem>(`/api/problems/${id}`)
const problem = response.data
```

### Using New Type Definitions

**Before**:

```tsx
interface Problem {
  time_limit?: number
  time_limit_ms?: number
  // Inconsistent naming
}
```

**After**:

```tsx
import type { Problem } from "@/types/api"

// Use standardized types
const problem: Problem = {
  time_limit_ms: 1000, // Only one field
  // ...
}
```

---

## 🚀 Future Improvements

### High Priority

1. ✅ ~~Add centralized API client~~ (Completed)
2. ✅ ~~Standardize API types~~ (Completed)
3. ✅ ~~Create skeleton loading states~~ (Completed)
4. 🔲 Add comprehensive E2E tests
5. 🔲 Implement error boundary components
6. 🔲 Add Sentry for error tracking

### Medium Priority

7. 🔲 Global state management (if needed)
8. 🔲 PWA support for offline capability
9. 🔲 Optimize images with Next.js Image
10. 🔲 Add virtual scrolling for long lists
11. 🔲 Implement route middleware for auth

### Low Priority

12. 🔲 Storybook for component documentation
13. 🔲 Animation library (Framer Motion)
14. 🔲 Advanced analytics
15. 🔲 i18n support (English/Vietnamese)

---

## 📞 Contact & Support

- **Project Repository**: [GitHub](https://github.com/Venus2Mice/code-grader-project)
- **Documentation**: `docs/` folder
- **Issues**: GitHub Issues

---

*Last Updated: October 20, 2025*  
*Version: 1.0.0*
