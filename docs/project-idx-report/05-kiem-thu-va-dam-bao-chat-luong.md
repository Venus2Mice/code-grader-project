# Phần 5: Kiểm thử và Đảm bảo Chất lượng

## 📊 Tổng quan

**Kiểm thử (Testing)** và **Đảm bảo chất lượng (Quality Assurance - QA)** là các quá trình quan trọng để đảm bảo ứng dụng hoạt động đúng, ổn định và đáp ứng các yêu cầu nghiệp vụ. Trong phần này, chúng ta sẽ tìm hiểu:

### 🎯 Mục tiêu của Testing

1. **Phát hiện lỗi sớm** → Tiết kiệm chi phí sửa chữa
2. **Đảm bảo chất lượng code** → Code dễ maintain, refactor
3. **Tự động hóa kiểm tra** → Giảm thời gian testing thủ công
4. **Tăng confidence** → An tâm khi deploy production
5. **Documentation** → Test cases là tài liệu sống về cách hoạt động của code

### 🏗️ Test Pyramid - Kim tự tháp Testing

Test Pyramid là mô hình phân bổ testing effort theo tỷ lệ tối ưu:

```yaml
Cấu trúc Test Pyramid:
  
         /\
        /E2E\      ← 10% (End-to-End Tests)
       /------\      • Slow, expensive
      /Integ. \   ← 20% (Integration Tests)
     /----------\    • Medium speed
    /Unit Tests \  ← 70% (Unit Tests)
   /--------------\   • Fast, cheap
  
  Chi phí:   Thấp → Cao
  Tốc độ:    Nhanh → Chậm
  Độ tin cậy: Thấp → Cao
```

**Giải thích các tầng:**

- **Unit Tests (70%)**: Test các function/component độc lập
  - Ưu điểm: Nhanh (<1ms), dễ viết, dễ debug
  - Nhược điểm: Không test integration giữa các phần
  
- **Integration Tests (20%)**: Test sự tương tác giữa các module
  - Ưu điểm: Phát hiện lỗi integration, test API/DB
  - Nhược điểm: Chậm hơn unit tests, phức tạp hơn setup
  
- **E2E Tests (10%)**: Test toàn bộ user flow trong browser
  - Ưu điểm: Test như người dùng thật, confidence cao nhất
  - Nhược điểm: Rất chậm (vài giây/test), flaky, khó maintain

### 📋 Các loại Testing khác

| Loại Testing | Mục đích | Tools |
|-------------|----------|-------|
| **Unit Testing** | Test logic riêng lẻ | Jest, Vitest |
| **Integration Testing** | Test tương tác giữa modules | Jest, MSW |
| **E2E Testing** | Test user flows | Playwright, Cypress |
| **Performance Testing** | Test tốc độ, load | Lighthouse, k6 |
| **Security Testing** | Test vulnerabilities | OWASP ZAP, Snyk |
| **Accessibility Testing** | Test a11y compliance | axe, Lighthouse |
| **Visual Regression** | Test UI changes | Percy, Chromatic |

---

## 5.1. Kiểm thử Ứng dụng

### 5.1.1. Unit Testing - Test đơn vị

**Unit Testing** là việc test các function, class, hoặc component riêng lẻ, độc lập với dependencies bên ngoài (API, database, services).

#### 🛠️ Setup Testing Framework

**Bước 1: Cài đặt Jest + React Testing Library**

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

**Các package và công dụng:**
- `jest`: Test runner và assertion library
- `@testing-library/react`: Test React components theo cách user interact
- `@testing-library/jest-dom`: Custom matchers cho DOM (toBeInTheDocument, toHaveClass, etc.)
- `@testing-library/user-event`: Simulate user interactions (click, type, hover)

**Bước 2: Cấu hình Jest**

```javascript
// jest.config.js
module.exports = {
  // Môi trường test: jsdom giả lập browser environment
  testEnvironment: 'jsdom',
  
  // Setup file chạy sau khi môi trường test được khởi tạo
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Module name mapping - alias paths và mock static assets
  moduleNameMapper: {
    // Map @ alias to src folder
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock CSS imports (trả về object rỗng)
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  
  // Thu thập coverage từ các file nào
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',  // Tất cả JS/TS files trong src
    '!src/**/*.d.ts',             // Loại trừ TypeScript definition files
    '!src/**/*.stories.{js,jsx,ts,tsx}', // Loại trừ Storybook stories
  ],
  
  // Ngưỡng coverage tối thiểu - nếu không đạt sẽ fail CI
  coverageThresholds: {
    global: {
      branches: 80,    // 80% các nhánh if/else được test
      functions: 80,   // 80% functions được call
      lines: 80,       // 80% dòng code được execute
      statements: 80,  // 80% statements được execute
    },
  },
};
```

**Giải thích các config quan trọng:**

- **testEnvironment: 'jsdom'**: Tạo fake browser environment với DOM API (document, window)
- **setupFilesAfterEnv**: Import các custom matchers và setup global
- **moduleNameMapper**: Giải quyết import alias và mock static assets
- **coverageThresholds**: Đặt ngưỡng tối thiểu → enforce code quality

```javascript
// jest.setup.js - Setup file được chạy trước mỗi test suite
import '@testing-library/jest-dom';

// Optional: Mock window.matchMedia (thường bị lỗi trong jsdom)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
```

---

#### ✍️ Writing Unit Tests - Viết Unit Tests

**Cấu trúc 1 Test Case (AAA Pattern):**

```typescript
it('should do something', () => {
  // 1. ARRANGE - Chuẩn bị dữ liệu test
  const input = 'test data';
  
  // 2. ACT - Thực thi hành động
  const result = functionUnderTest(input);
  
  // 3. ASSERT - Kiểm tra kết quả
  expect(result).toBe('expected output');
});
```

---

##### 📦 Component Testing - Test React Components

**Example 1: Test Button Component**

```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  // Test 1: Kiểm tra rendering cơ bản
  it('renders with correct text', () => {
    // ARRANGE: Render component với prop text
    render(<Button>Click me</Button>);
    
    // ASSERT: Kiểm tra text có hiển thị trong document không
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  // Test 2: Kiểm tra event handling
  it('calls onClick handler when clicked', () => {
    // ARRANGE: Tạo mock function để track việc gọi hàm
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    // ACT: Simulate click event
    fireEvent.click(screen.getByText('Click me'));
    
    // ASSERT: Kiểm tra mock function đã được gọi đúng 1 lần
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // Test 3: Kiểm tra disabled state
  it('is disabled when disabled prop is true', () => {
    // ARRANGE: Render button với prop disabled
    render(<Button disabled>Click me</Button>);
    
    // ASSERT: Kiểm tra button có attribute disabled
    const button = screen.getByText('Click me');
    expect(button).toBeDisabled();
  });

  // Test 4: Kiểm tra loading state
  it('shows loading state', () => {
    // ARRANGE: Render button với loading=true
    render(<Button loading>Click me</Button>);
    
    // ASSERT: Kiểm tra loading text xuất hiện
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  // Test 5: Kiểm tra CSS class variants
  it('applies correct variant class', () => {
    // ARRANGE: Render với variant="secondary"
    const { container } = render(<Button variant="secondary">Click me</Button>);
    
    // ASSERT: Kiểm tra button có class 'secondary'
    const button = container.querySelector('button');
    expect(button).toHaveClass('secondary');
  });
});
```

**Các Matchers thường dùng:**

| Matcher | Công dụng | Example |
|---------|-----------|---------|
| `toBeInTheDocument()` | Kiểm tra element có trong DOM | `expect(element).toBeInTheDocument()` |
| `toHaveTextContent(text)` | Kiểm tra text content | `expect(div).toHaveTextContent('Hello')` |
| `toHaveClass(class)` | Kiểm tra CSS class | `expect(button).toHaveClass('primary')` |
| `toBeDisabled()` | Kiểm tra disabled state | `expect(input).toBeDisabled()` |
| `toHaveValue(value)` | Kiểm tra input value | `expect(input).toHaveValue('test')` |
| `toHaveAttribute(attr, value)` | Kiểm tra attribute | `expect(link).toHaveAttribute('href', '/page')` |

---

##### 🪝 Hook Testing - Test Custom Hooks

**Lưu ý quan trọng**: React Hooks KHÔNG thể gọi trực tiếp trong tests (rules of hooks). Phải dùng `renderHook` từ `@testing-library/react`.

```typescript
// useAuth.test.ts
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';

describe('useAuth', () => {
  // Test 1: Initial state
  it('initializes with no user', () => {
    // ARRANGE & ACT: Render hook
    const { result } = renderHook(() => useAuth());
    
    // ASSERT: Kiểm tra initial state
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  // Test 2: Async login action
  it('logs in user successfully', async () => {
    // ARRANGE: Render hook
    const { result } = renderHook(() => useAuth());
    
    // ACT: Gọi login method (wrap trong act để đợi state updates)
    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });
    
    // ASSERT: Kiểm tra user state sau login
    expect(result.current.user).toBeDefined();
    expect(result.current.user?.email).toBe('test@example.com');
    expect(result.current.isAuthenticated).toBe(true);
  });

  // Test 3: Logout clears user
  it('logs out user', async () => {
    // ARRANGE: Render và login trước
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });
    
    // ACT: Logout
    await act(async () => {
      await result.current.logout();
    });
    
    // ASSERT: User state đã bị clear
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
  
  // Test 4: Error handling
  it('handles login error', async () => {
    const { result } = renderHook(() => useAuth());
    
    // ACT: Login với credentials sai
    await act(async () => {
      try {
        await result.current.login('wrong@example.com', 'wrongpass');
      } catch (error) {
        // Expected error
      }
    });
    
    // ASSERT: User vẫn null, có error message
    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeDefined();
  });
});
```

**Giải thích các concepts:**

- **`renderHook`**: Render hook trong test environment, trả về `result.current` chứa return value của hook
- **`act()`**: Wrap các actions gây state updates → đảm bảo React flush tất cả updates trước khi assert
- **Async testing**: Dùng `async/await` cho hooks có side effects (API calls, timeouts)

---

##### 🔧 Service Testing - Test Business Logic với Mocking

**Mocking** là kỹ thuật thay thế dependencies thật (API calls, database) bằng fake implementations để test isolated logic.

```typescript
// userService.test.ts
import { userService } from './userService';
import api from '@/lib/api';

// Mock toàn bộ api module
jest.mock('@/lib/api');

describe('userService', () => {
  // Cleanup sau mỗi test để tránh side effects
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    // Test 1: Success case
    it('fetches user profile successfully', async () => {
      // ARRANGE: Setup mock response data
      const mockUser = { 
        id: '1', 
        email: 'test@example.com', 
        name: 'Test User' 
      };
      
      // Mock api.get để trả về mock data
      (api.get as jest.Mock).mockResolvedValue({ data: mockUser });

      // ACT: Call service method
      const result = await userService.getProfile();

      // ASSERT: Kiểm tra api.get được gọi với đúng endpoint
      expect(api.get).toHaveBeenCalledWith('/users/profile');
      
      // Kiểm tra kết quả trả về đúng
      expect(result).toEqual(mockUser);
    });

    // Test 2: Error case
    it('handles error when fetching profile', async () => {
      // ARRANGE: Mock api.get throw error
      const errorMessage = 'Network error';
      (api.get as jest.Mock).mockRejectedValue(new Error(errorMessage));

      // ACT & ASSERT: Expect promise reject
      await expect(userService.getProfile()).rejects.toThrow(errorMessage);
    });
    
    // Test 3: Kiểm tra error handling với specific error codes
    it('handles 404 error specifically', async () => {
      // ARRANGE: Mock 404 error response
      const error404 = {
        response: {
          status: 404,
          data: { message: 'User not found' }
        }
      };
      (api.get as jest.Mock).mockRejectedValue(error404);

      // ACT & ASSERT
      await expect(userService.getProfile()).rejects.toMatchObject(error404);
    });
  });

  describe('updateProfile', () => {
    it('updates user profile successfully', async () => {
      // ARRANGE: Setup update data và mock response
      const updateData = { name: 'Updated Name' };
      const mockResponse = { id: '1', email: 'test@example.com', ...updateData };
      (api.put as jest.Mock).mockResolvedValue({ data: mockResponse });

      // ACT: Call update method
      const result = await userService.updateProfile(updateData);

      // ASSERT: Kiểm tra api.put được gọi với đúng params
      expect(api.put).toHaveBeenCalledWith('/users/profile', updateData);
      
      // Kiểm tra kết quả trả về đúng
      expect(result).toEqual(mockResponse);
      expect(result.name).toBe('Updated Name');
    });
    
    // Test 4: Validation error
    it('throws validation error for invalid data', async () => {
      const invalidData = { name: '' }; // Empty name
      const validationError = {
        response: {
          status: 400,
          data: { errors: { name: 'Name is required' } }
        }
      };
      (api.put as jest.Mock).mockRejectedValue(validationError);

      await expect(userService.updateProfile(invalidData))
        .rejects
        .toMatchObject(validationError);
    });
  });
});
```

**Các Jest Mock Methods:**

| Method | Công dụng | Example |
|--------|-----------|---------|
| `jest.fn()` | Tạo mock function | `const mockFn = jest.fn()` |
| `jest.mock('module')` | Mock entire module | `jest.mock('@/lib/api')` |
| `mockResolvedValue(value)` | Mock async success | `fn.mockResolvedValue({data: 'ok'})` |
| `mockRejectedValue(error)` | Mock async error | `fn.mockRejectedValue(new Error('fail'))` |
| `mockReturnValue(value)` | Mock sync return | `fn.mockReturnValue(42)` |
| `jest.clearAllMocks()` | Clear all mock data | `afterEach(() => jest.clearAllMocks())` |
| `toHaveBeenCalledWith(args)` | Check function calls | `expect(fn).toHaveBeenCalledWith('arg')` |
| `toHaveBeenCalledTimes(n)` | Check call count | `expect(fn).toHaveBeenCalledTimes(2)` |

---

### 5.1.2. Integration Testing - Test tích hợp

**Integration Testing** test sự tương tác giữa nhiều modules/components/services cùng nhau. Không test isolated như unit tests, mà test real workflows.

#### 🌐 API Integration Tests với MSW (Mock Service Worker)

**MSW** (Mock Service Worker) là công cụ mock HTTP requests ở network level → giống như có real API server.

**Bước 1: Cài đặt MSW**

```bash
npm install --save-dev msw
```

**Bước 2: Setup MSW Server và viết tests**

```typescript
// api.integration.test.ts
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { userApi } from '@/services/api/userApi';

// Setup mock API server với handlers
const server = setupServer(
  // Handler cho GET /api/users/profile
  rest.get('/api/users/profile', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      })
    );
  }),

  rest.put('/api/users/profile', (req, res, ctx) => {
    return res(
      ctx.json({
        id: '1',
        ...req.body,
      })
    );
  })
);

// Lifecycle hooks
beforeAll(() => server.listen()); // Start server trước tất cả tests
afterEach(() => server.resetHandlers()); // Reset handlers sau mỗi test
afterAll(() => server.close()); // Đóng server sau tất cả tests

describe('User API Integration', () => {
  // Test 1: Full workflow - Fetch và Update
  it('fetches and updates user profile', async () => {
    // ACT: Fetch profile
    const profile = await userApi.getProfile();
    
    // ASSERT: Initial data đúng
    expect(profile.name).toBe('Test User');
    expect(profile.email).toBe('test@example.com');

    // ACT: Update profile
    const updated = await userApi.updateProfile({ name: 'New Name' });
    
    // ASSERT: Updated data đúng
    expect(updated.name).toBe('New Name');
    expect(updated.email).toBe('test@example.com'); // Email không đổi
  });

  // Test 2: Error handling
  it('handles API errors gracefully', async () => {
    // ARRANGE: Override handler để trả về 500 error
    server.use(
      rest.get('/api/users/profile', (req, res, ctx) => {
        return res(
          ctx.status(500), 
          ctx.json({ error: 'Server error' })
        );
      })
    );

    // ACT & ASSERT: Expect error được throw
    await expect(userApi.getProfile()).rejects.toThrow();
  });
  
  // Test 3: Authentication error
  it('handles 401 unauthorized error', async () => {
    server.use(
      rest.get('/api/users/profile', (req, res, ctx) => {
        // Check Authorization header
        const authHeader = req.headers.get('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res(
            ctx.status(401),
            ctx.json({ error: 'Unauthorized' })
          );
        }
        
        return res(ctx.json({ id: '1', name: 'Authorized User' }));
      })
    );
    
    // Without token → should fail
    await expect(userApi.getProfile()).rejects.toThrow('Unauthorized');
    
    // With token → should succeed
    userApi.setAuthToken('valid-token-123');
    const profile = await userApi.getProfile();
    expect(profile.name).toBe('Authorized User');
  });
});
```

**MSW Best Practices:**

- ✅ **Use MSW for integration tests** → Real network behavior
- ✅ **Keep handlers simple** → Focus on response structure
- ✅ **Test error cases** → Override handlers với `server.use()`
- ✅ **Reset handlers** → `afterEach(() => server.resetHandlers())`
- ❌ **Don't use MSW for unit tests** → Too heavy, use `jest.mock()` instead

---

#### 🧩 Component Integration Tests - Test nhiều components cùng nhau

**Component Integration Tests** test tương tác giữa parent và child components, với contexts, providers.

```typescript
// LoginForm.integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';
import { AuthProvider } from '@/contexts/AuthContext';

describe('LoginForm Integration', () => {
  // Helper function để render với providers
  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <AuthProvider>
        {ui}
      </AuthProvider>
    );
  };
  
  // Test 1: Success login flow
  it('logs in user with valid credentials', async () => {
    // ARRANGE: Render form with AuthProvider
    renderWithProviders(<LoginForm />);
    
    // Get form elements
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    // ACT: User interactions
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);

    // ASSERT: Wait for async actions và check success message
    await waitFor(() => {
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });
  });

  // Test 2: Error handling
  it('shows error for invalid credentials', async () => {
    renderWithProviders(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    // ACT: Login với credentials sai
    await userEvent.type(emailInput, 'wrong@example.com');
    await userEvent.type(passwordInput, 'wrongpassword');
    await userEvent.click(submitButton);

    // ASSERT: Error message xuất hiện
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
  
  // Test 3: Validation errors
  it('shows validation errors for empty fields', async () => {
    renderWithProviders(<LoginForm />);
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    
    // ACT: Submit without filling fields
    await userEvent.click(submitButton);
    
    // ASSERT: Validation errors appear
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });
  
  // Test 4: Loading state
  it('disables form during submission', async () => {
    renderWithProviders(<LoginForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });
    
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);
    
    // ASSERT: Button disabled và loading state
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/logging in/i)).toBeInTheDocument();
  });
});
```

**userEvent vs fireEvent:**

| Aspect | fireEvent | userEvent |
|--------|-----------|-----------|
| **Behavior** | Dispatch DOM events directly | Simulate real user interactions |
| **Usage** | `fireEvent.click(button)` | `await userEvent.click(button)` |
| **Async** | Synchronous | Asynchronous (returns Promise) |
| **Realism** | Low (only 1 event) | High (multiple events + delays) |
| **Recommendation** | ❌ Avoid if possible | ✅ Prefer for user interactions |

**Example:**
- `fireEvent.change()`: Chỉ dispatch 1 `change` event
- `userEvent.type()`: Dispatch `keydown` → `keypress` → `keyup` → `input` → `change` cho MỖI ký tự

---

### 5.1.3. End-to-End Testing - Test toàn bộ User Flow

**E2E Testing** test ứng dụng trong real browser, simulate user workflows từ đầu đến cuối.

#### 🎭 Playwright Setup - Công cụ E2E Testing hiện đại

**Playwright** là automation framework hỗ trợ Chromium, Firefox, WebKit (Safari).

**Bước 1: Cài đặt Playwright**

```bash
npm install --save-dev @playwright/test
npx playwright install  # Tải browsers
```

**Bước 2: Cấu hình Playwright**

**Playwright Configuration:**

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Thư mục chứa E2E tests
  testDir: './e2e',
  
  // Chạy tests song song (parallel)
  fullyParallel: true,
  
  // Fail CI nếu có .only() trong code (tránh vô tình commit test isolated)
  forbidOnly: !!process.env.CI,
  
  // Retry failed tests (trên CI retry 2 lần, local không retry)
  retries: process.env.CI ? 2 : 0,
  
  // Workers: CI chạy 1 worker, local tùy CPU cores
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter: HTML report (xem kết quả visual)
  reporter: 'html',
  
  // Global use options - áp dụng cho tất cả tests
  use: {
    // Base URL - các page.goto() paths sẽ relative với URL này
    baseURL: 'http://localhost:3000',
    
    // Trace: Ghi lại video/screenshots khi test fail lần đầu
    trace: 'on-first-retry',
    
    // Screenshot khi fail
    screenshot: 'only-on-failure',
    
    // Video recording
    video: 'retain-on-failure',
  },

  // Projects: Test trên nhiều browsers/devices
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Web Server: Tự động start dev server trước khi chạy tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI, // Reuse nếu đã có server running
    timeout: 120 * 1000, // 2 phút timeout
  },
});
```

**Giải thích config quan trọng:**

- **fullyParallel: true** → Tests chạy song song → nhanh hơn
- **retries: 2 (CI)** → Giảm false positives do flaky tests
- **trace: 'on-first-retry'** → Ghi lại trace cho debugging
- **projects[]** → Test trên nhiều browsers → đảm bảo cross-browser compatibility
- **webServer** → Tự động start server → không cần manual start

---

#### ✍️ Writing E2E Tests - Viết E2E Tests

**Example 1: Authentication Flow - Test luồng đăng ký, đăng nhập, đăng xuất**

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  // Test 1: Full auth cycle - Signup → Login → Logout
  test('user can sign up, login, and logout', async ({ page }) => {
    // ========== SIGN UP ==========
    // Navigate to signup page
    await page.goto('/signup');
    
    // Fill form fields
    await page.fill('[name="email"]', 'newuser@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="confirmPassword"]', 'SecurePass123!');
    
    // Submit form
    await page.click('button[type="submit"]');

    // ASSERT: Redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome')).toBeVisible();

    // ========== LOGOUT ==========
    // Open user menu
    await page.click('[aria-label="User menu"]');
    await page.click('text=Logout');

    // ASSERT: Redirect to login
    await expect(page).toHaveURL('/login');

    // ========== LOGIN AGAIN ==========
    await page.fill('[name="email"]', 'newuser@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // ASSERT: Back to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  // Test 2: Validation errors
  test('shows validation errors for invalid input', async ({ page }) => {
    await page.goto('/signup');
    
    // Fill với invalid data
    await page.fill('[name="email"]', 'invalid-email'); // Invalid email
    await page.fill('[name="password"]', '123'); // Too short
    await page.click('button[type="submit"]');

    // ASSERT: Error messages xuất hiện
    await expect(page.locator('text=Invalid email')).toBeVisible();
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
  });
  
  // Test 3: Password mismatch
  test('shows error when passwords do not match', async ({ page }) => {
    await page.goto('/signup');
    
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="confirmPassword"]', 'DifferentPass456!');
    await page.click('button[type="submit"]');
    
    // ASSERT: Mismatch error
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });
});
```

**Example 2: Shopping Flow - Test luồng mua hàng**

```typescript
// e2e/shopping.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Shopping Flow', () => {
  // Login trước mỗi test (authentication required)
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  // Test 1: Add to cart và checkout
  test('user can add item to cart and checkout', async ({ page }) => {
    // ========== BROWSE PRODUCTS ==========
    await page.goto('/products');
    
    // Click vào product đầu tiên
    await page.click('.product-card:first-child');
    
    // Wait for product page load
    await page.waitForSelector('h1'); // Product title

    // ========== ADD TO CART ==========
    await page.click('button:has-text("Add to Cart")');
    
    // ASSERT: Cart badge updates
    await expect(page.locator('.cart-badge')).toHaveText('1');

    // ========== GO TO CART ==========
    await page.click('[aria-label="Cart"]');
    await expect(page).toHaveURL('/cart');
    
    // ASSERT: Cart có 1 item
    await expect(page.locator('.cart-item')).toHaveCount(1);

    // ========== CHECKOUT ==========
    await page.click('button:has-text("Checkout")');
    
    // Fill shipping info
    await page.fill('[name="address"]', '123 Main St');
    await page.fill('[name="city"]', 'Ho Chi Minh');
    await page.fill('[name="zipCode"]', '700000');
    await page.click('button:has-text("Place Order")');

    // ASSERT: Success message
    await expect(page.locator('text=Order placed successfully')).toBeVisible();
  });
  
  // Test 2: Remove item from cart
  test('user can remove item from cart', async ({ page }) => {
    // Add item to cart first
    await page.goto('/products');
    await page.click('.product-card:first-child');
    await page.click('button:has-text("Add to Cart")');
    
    // Go to cart
    await page.goto('/cart');
    
    // Remove item
    await page.click('[aria-label="Remove item"]');
    
    // ASSERT: Cart empty
    await expect(page.locator('text=Your cart is empty')).toBeVisible();
    await expect(page.locator('.cart-badge')).toHaveText('0');
  });
  
  // Test 3: Apply discount code
  test('user can apply discount code', async ({ page }) => {
    // Add item to cart
    await page.goto('/products');
    await page.click('.product-card:first-child');
    await page.click('button:has-text("Add to Cart")');
    await page.goto('/cart');
    
    // Get original total
    const originalTotal = await page.locator('.total-price').textContent();
    
    // Apply discount
    await page.fill('[name="discountCode"]', 'SAVE10');
    await page.click('button:has-text("Apply")');
    
    // Wait for price update
    await page.waitForTimeout(500);
    
    // ASSERT: Total giảm
    const newTotal = await page.locator('.total-price').textContent();
    expect(newTotal).not.toBe(originalTotal);
    await expect(page.locator('text=Discount applied')).toBeVisible();
  });
});
```

**Playwright Best Practices:**

| Practice | Mô tả | Example |
|----------|-------|---------|
| **Use data-testid** | Selector ổn định hơn class/text | `[data-testid="login-button"]` |
| **Wait for conditions** | Đợi elements sẵn sàng | `await page.waitForSelector('.loaded')` |
| **Avoid hardcoded waits** | ❌ `waitForTimeout(5000)` → ✅ `waitForSelector()` |
| **Use beforeEach** | Setup common state (login, seed data) | See shopping example |
| **Isolate tests** | Mỗi test độc lập, không depend vào nhau | Use `test.beforeEach()` |
| **Handle flakiness** | Retry failed tests (config `retries: 2`) | In playwright.config.ts |

---

### 5.1.4. Performance Testing - Test hiệu suất

**Performance Testing** đảm bảo ứng dụng load nhanh, responsive, không có bottlenecks.

#### 🚀 Lighthouse CI - Test Core Web Vitals

**Lighthouse** là tool của Google audit performance, accessibility, SEO, best practices.

**Bước 1: Cài đặt Lighthouse CI**

```bash
npm install --save-dev @lhci/cli
```

**Bước 2: Cấu hình Lighthouse CI**

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    // Collect: Chạy Lighthouse audits
    collect: {
      // Start server command
      startServerCommand: 'npm run start',
      // URLs để test
      url: [
        'http://localhost:3000',              // Homepage
        'http://localhost:3000/products',     // Products page
        'http://localhost:3000/about',        // About page
      ],
      // Số lần chạy mỗi URL (lấy trung bình để giảm variance)
      numberOfRuns: 3,
    },
    
    // Assert: Đặt ngưỡng tối thiểu
    assert: {
      assertions: {
        // Performance score >= 90%
        'categories:performance': ['error', { minScore: 0.9 }],
        
        // Accessibility score >= 90%
        'categories:accessibility': ['error', { minScore: 0.9 }],
        
        // Best Practices score >= 90%
        'categories:best-practices': ['error', { minScore: 0.9 }],
        
        // SEO score >= 90%
        'categories:seo': ['error', { minScore: 0.9 }],
        
        // Specific metrics
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }], // FCP < 2s
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }], // LCP < 2.5s
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }], // CLS < 0.1
        'total-blocking-time': ['warn', { maxNumericValue: 300 }], // TBT < 300ms
      },
    },
    
    // Upload: Lưu results
    upload: {
      target: 'temporary-public-storage', // Public temporary storage
      // Or use 'filesystem' để save locally
      // target: 'filesystem',
      // outputDir: './lighthouse-reports',
    },
  },
};
```

**Chạy Lighthouse CI:**

```bash
# Chạy local
npx lhci autorun

# Xem report
npx lhci open
```

**Core Web Vitals Explained:**

| Metric | Mô tả | Good Score |
|--------|-------|------------|
| **FCP** (First Contentful Paint) | Thời gian content đầu tiên hiển thị | < 1.8s |
| **LCP** (Largest Contentful Paint) | Thời gian element lớn nhất load | < 2.5s |
| **CLS** (Cumulative Layout Shift) | Độ ổn định layout (không nhảy) | < 0.1 |
| **FID** (First Input Delay) | Thời gian phản hồi interaction đầu tiên | < 100ms |
| **TBT** (Total Blocking Time) | Tổng thời gian main thread bị block | < 300ms |

---

#### 📊 Load Testing với k6 - Test tải cao

**k6** là load testing tool test khả năng chịu tải của backend APIs.

**Bước 1: Cài đặt k6**

```bash
# macOS
brew install k6

# Windows (chocolatey)
choco install k6

# Linux
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Bước 2: Viết Load Test Script**

```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metric: Error rate
const errorRate = new Rate('errors');

// Test stages - Ramping VUs (Virtual Users)
export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp up to 20 users trong 30s
    { duration: '1m', target: 50 },    // Ramp up to 50 users trong 1m
    { duration: '30s', target: 100 },  // Spike to 100 users
    { duration: '1m', target: 50 },    // Scale down to 50
    { duration: '30s', target: 0 },    // Ramp down to 0
  ],
  
  // Thresholds - Fail nếu không đạt
  thresholds: {
    'http_req_duration': ['p(95)<500'],  // 95% requests < 500ms
    'http_req_failed': ['rate<0.01'],    // Error rate < 1%
    'errors': ['rate<0.05'],             // Custom error rate < 5%
  },
};

// Test function - chạy bởi mỗi VU
export default function () {
  // ========== Test GET /api/products ==========
  const productsResponse = http.get('https://your-app.com/api/products');
  
  // Check response
  const productsCheck = check(productsResponse, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'has products': (r) => JSON.parse(r.body).length > 0,
  });
  
  // Track errors
  errorRate.add(!productsCheck);
  
  // ========== Test POST /api/orders ==========
  const orderPayload = JSON.stringify({
    productId: '123',
    quantity: 1,
    userId: 'test-user',
  });
  
  const orderParams = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token-123',
    },
  };
  
  const orderResponse = http.post(
    'https://your-app.com/api/orders',
    orderPayload,
    orderParams
  );
  
  check(orderResponse, {
    'order created': (r) => r.status === 201,
  });
  
  // Think time - simulate user reading content
  sleep(1);
}

// Setup: Chạy 1 lần trước test
export function setup() {
  console.log('Starting load test...');
  // Optional: Setup test data
}

// Teardown: Chạy 1 lần sau test
export function teardown(data) {
  console.log('Load test completed!');
  // Optional: Cleanup test data
}
```

**Chạy k6 test:**

```bash
# Run test
k6 run load-test.js

# Run with options
k6 run --vus 100 --duration 30s load-test.js

# Output to file
k6 run --out json=results.json load-test.js
```

**k6 Output Example:**

```
     ✓ status is 200
     ✓ response time < 500ms
     
     checks.........................: 98.50% ✓ 1970      ✗ 30
     data_received..................: 15 MB  250 kB/s
     data_sent......................: 1.2 MB 20 kB/s
     http_req_blocked...............: avg=1.2ms   min=0s      med=0s      max=145ms   p(90)=0s      p(95)=0s     
     http_req_duration..............: avg=245ms   min=102ms   med=230ms   max=890ms   p(90)=340ms   p(95)=420ms  
     http_reqs......................: 2000   33.33/s
     iteration_duration.............: avg=1.25s   min=1.1s    med=1.23s   max=2.1s    p(90)=1.35s   p(95)=1.45s  
     iterations.....................: 2000   33.33/s
     vus............................: 100    min=0       max=100
```

---

### 5.1.5. Security Testing - Test bảo mật

**Security Testing** phát hiện vulnerabilities (XSS, SQL Injection, CSRF, etc.)

#### 🔒 OWASP ZAP Integration - Automated Security Scan

**OWASP ZAP** (Zed Attack Proxy) là security scanner tìm common vulnerabilities.

**GitHub Actions Workflow cho ZAP Scan:**

```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  zap_scan:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Start application
        run: |
          npm start &
          sleep 10  # Wait for server to start
      
      - name: Run ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.7.0
        with:
          target: 'http://localhost:3000'
          # Rules: Các rules để scan
          rules_file_name: '.zap/rules.tsv'
          # Fail action nếu có high risk alerts
          cmd_options: '-a'
      
      - name: Upload ZAP Report
        if: always()
        uses: actions/upload-artifact@v2
        with:
          name: zap-report
          path: report_html.html
```

**ZAP scan types:**

| Scan Type | Mô tả | Speed | Coverage |
|-----------|-------|-------|----------|
| **Baseline** | Quick passive scan | Fast (~5 min) | Basic |
| **Full Scan** | Active scan with crawling | Slow (hours) | Comprehensive |
| **API Scan** | Targeted API endpoint scan | Medium | API-specific |

---

#### 🔍 Dependency Vulnerability Scanning - Scan thư viện bên thứ 3

**npm audit** - Built-in vulnerability checker:

```bash
# Check for vulnerabilities
npm audit

# Show audit report in JSON
npm audit --json

# Fix vulnerabilities (auto update packages)
npm audit fix

# Fix including breaking changes
npm audit fix --force
```

**Snyk** - Advanced vulnerability scanner:

```bash
# Cài đặt Snyk CLI
npm install -g snyk

# Authenticate
snyk auth

# Test project for vulnerabilities
snyk test

# Monitor project (continuous monitoring)
snyk monitor

# Test Docker images
snyk container test node:18-alpine

# Test Infrastructure as Code (IaC)
snyk iac test ./terraform/
```

**GitHub Dependabot** - Automatic security updates:

```yaml
# .github/dependabot.yml
version: 2
updates:
  # Enable version updates for npm
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    # Auto-merge minor and patch updates
    open-pull-requests-limit: 10
    # Group updates
    groups:
      dev-dependencies:
        patterns:
          - "@types/*"
          - "eslint*"
          - "prettier"
```

---

## 5.2. Phát hiện và Sửa lỗi - Debugging & Error Tracking

### 5.2.1. Debugging Tools - Công cụ Debug

#### 🔧 Browser DevTools - Console và Breakpoints

**Console Logging với best practices:**

```typescript
// ❌ BAD: Simple console.log trong production
console.log('User data:', userData);

// ✅ GOOD: Conditional logging chỉ trong development
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}

// ✅ BETTER: Structured logging với grouping
console.group('🔐 User Login');
console.log('Email:', email);
console.log('Timestamp:', new Date().toISOString());
console.log('User Agent:', navigator.userAgent);
console.groupEnd();

// ✅ BEST: Different log levels
console.info('ℹ️ Info: User logged in');
console.warn('⚠️ Warning: Slow response time');
console.error('❌ Error:', error);
console.table([{ name: 'John', age: 30 }, { name: 'Jane', age: 25 }]);
```

**Breakpoints - Debugging trong Browser:**

```typescript
// 1. Debugger statement - pause execution
function processOrder(orderId: string) {
  debugger; // ← Code sẽ pause tại đây khi DevTools open
  
  const order = getOrder(orderId);
  return order;
}

// 2. Conditional breakpoint - chỉ pause khi điều kiện đúng
function updateUser(userId: string, data: any) {
  // Trong DevTools, set breakpoint với condition: userId === '123'
  if (userId === '123') {
    debugger; // Chỉ pause cho userId 123
  }
  
  database.update(userId, data);
}
```

---

#### 🐞 VS Code Debugging - Debug trong IDE

**VS Code Debug Configuration:**

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    // Debug Next.js Server-Side
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    
    // Debug Next.js Client-Side
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    },
    
    // Debug Jest Tests
    {
      "name": "Jest: debug current file",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["${fileBasename}", "--runInBand"],
      "console": "integratedTerminal"
    }
  ]
}
```

---

### 5.2.2. Error Tracking - Theo dõi Lỗi Production

#### 🚨 Sentry Integration - Error Monitoring

**Sentry** track errors trong production với full context (stack trace, user info, breadcrumbs).

**Setup Sentry:**

```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

**Configure Sentry:**

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Trace 10% requests trong production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_APP_VERSION,
  
  // Filter sensitive data
  beforeSend(event, hint) {
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.['authorization'];
    }
    return event;
  },
  
  // Integrations
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
```

**Error Boundary:**

```typescript
import { ErrorBoundary } from '@sentry/nextjs';

function ErrorFallback({ error, resetError }) {
  return (
    <div className="error-page">
      <h1>⚠️ Something went wrong</h1>
      <button onClick={resetError}>Try Again</button>
    </div>
  );
}

function App({ Component, pageProps }) {
  return (
    <ErrorBoundary fallback={ErrorFallback}>
      <Component {...pageProps} />
    </ErrorBoundary>
  );
}
```

**Manual Error Tracking:**

```typescript
// Capture exceptions
try {
  processPayment(orderId);
} catch (error) {
  Sentry.captureException(error, {
    tags: { section: 'payment' },
    level: 'error',
  });
}

// Capture messages
Sentry.captureMessage('Unusual user action', {
  level: 'warning',
  tags: { action: 'bulk-delete' },
});

// Add breadcrumbs (user actions trail)
Sentry.addBreadcrumb({
  category: 'ui',
  message: 'User clicked checkout',
  data: { cartTotal: '$129.99' },
});

// Set user context
Sentry.setUser({
  id: user.id,
  email: user.email,
});
```

---

### 5.2.3. Logging Strategy - Chiến lược Logging

**Structured Logging** giúp dễ search, filter, analyze logs.

```typescript
// utils/logger.ts
enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

class Logger {
  private static log(level: LogLevel, message: string, meta?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta,
      userId: globalThis.__userId,
      requestId: globalThis.__requestId,
    };

    // Production: Send to logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(logEntry);
    } else {
      // Development: Pretty print
      const emoji = {
        DEBUG: '🔍',
        INFO: 'ℹ️',
        WARN: '⚠️',
        ERROR: '❌',
      }[level];
      console.log(`${emoji} [${level}] ${message}`, meta || '');
    }
  }

  static debug(message: string, meta?: any) {
    this.log(LogLevel.DEBUG, message, meta);
  }

  static info(message: string, meta?: any) {
    this.log(LogLevel.INFO, message, meta);
  }

  static warn(message: string, meta?: any) {
    this.log(LogLevel.WARN, message, meta);
  }

  static error(message: string, error?: Error, meta?: any) {
    this.log(LogLevel.ERROR, message, {
      ...meta,
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
      },
    });
  }

  private static sendToLoggingService(logEntry: any) {
    fetch('/api/logs', {
      method: 'POST',
      body: JSON.stringify(logEntry),
    }).catch(console.error);
  }
}

export default Logger;
```

---

## 5.3. Quality Assurance Checklist - Danh sách Kiểm tra

**Checklist này đảm bảo ứng dụng đạt standards trước khi deploy production.**

### 5.3.1. Code Quality - Chất lượng Code

- [ ] **All tests passing** - Tất cả tests (unit, integration, E2E) pass
- [ ] **Code coverage >= 80%** - Coverage thresholds đạt yêu cầu
  ```bash
  npm run test -- --coverage
  ```
- [ ] **No ESLint errors** - Không có linting errors
  ```bash
  npm run lint
  ```
- [ ] **No TypeScript errors** - Type checking pass
  ```bash
  npm run type-check
  ```
- [ ] **Code reviewed** - Có ít nhất 1 reviewer approve PR
- [ ] **No console.log** - Remove hoặc wrap trong `if (DEV)` blocks
- [ ] **No commented code** - Remove dead code
- [ ] **Dependencies updated** - No critical vulnerabilities
  ```bash
  npm audit
  ```

---

### 5.3.2. Functionality - Chức năng

- [ ] **All features working** - Happy paths work correctly
- [ ] **Edge cases handled** - Null, undefined, empty states
- [ ] **Error states tested** - Network errors, validation errors
- [ ] **Loading states implemented** - Skeletons, spinners during async operations
- [ ] **Form validation** - Client-side và server-side validation
- [ ] **Navigation working** - All links, routing work correctly
- [ ] **Responsive design** - Test trên mobile, tablet, desktop
- [ ] **Cross-browser tested** - Chrome, Firefox, Safari compatible
- [ ] **Offline behavior** - Graceful degradation khi offline

---

### 5.3.3. Performance - Hiệu suất

- [ ] **Lighthouse score >= 90** - All categories (Performance, A11y, Best Practices, SEO)
  ```bash
  npx lhci autorun
  ```
- [ ] **First Contentful Paint < 1.5s** - Content hiển thị nhanh
- [ ] **Largest Contentful Paint < 2.5s** - Main content load nhanh
- [ ] **Time to Interactive < 3.5s** - Page interactive sớm
- [ ] **Cumulative Layout Shift < 0.1** - Layout không nhảy
- [ ] **No memory leaks** - Profile với DevTools Memory tab
- [ ] **Images optimized** - WebP format, lazy loading, proper sizing
- [ ] **Code splitting** - Dynamic imports cho routes
- [ ] **Bundle size < 200KB** - Main bundle không quá lớn
  ```bash
  npm run build
  # Check .next/static/chunks/ sizes
  ```

---

### 5.3.4. Security - Bảo mật

- [ ] **No security vulnerabilities** - `npm audit` clean
- [ ] **Authentication working** - Login/logout flow secure
- [ ] **Authorization checks** - Protected routes enforced
- [ ] **Input validation** - XSS, SQL injection prevention
- [ ] **HTTPS enforced** - Redirect HTTP → HTTPS
- [ ] **CORS configured** - Whitelist allowed origins
- [ ] **CSP headers** - Content Security Policy implemented
- [ ] **Rate limiting** - API endpoints rate limited
- [ ] **Sensitive data encrypted** - Passwords hashed, tokens encrypted
- [ ] **OWASP ZAP scan** - No high/medium alerts
  ```bash
  # Run ZAP baseline scan
  docker run -v $(pwd):/zap/wrk/:rw -t owasp/zap2docker-stable \
    zap-baseline.py -t http://localhost:3000 -r report.html
  ```

---

### 5.3.5. Accessibility - Khả năng Tiếp cận

- [ ] **Keyboard navigation** - Tab order logical, focus visible
- [ ] **Screen reader compatible** - ARIA labels, semantic HTML
- [ ] **Color contrast >= 4.5:1** - WCAG AA standard
- [ ] **No flashing content** - Avoid seizure triggers
- [ ] **Alt text for images** - Meaningful descriptions
- [ ] **Form labels** - All inputs have associated labels
- [ ] **Focus indicators visible** - Clear focus states
- [ ] **Zoom support** - Text scales to 200% without breaking
- [ ] **axe DevTools scan** - No accessibility issues
  ```bash
  # Install axe DevTools browser extension
  # Or use @axe-core/cli
  npx @axe-core/cli http://localhost:3000
  ```

---

## 5.4. Kết luận - Conclusion

**Kiểm thử và Đảm bảo Chất lượng** là quá trình liên tục throughout development lifecycle, không phải chỉ ở giai đoạn cuối.

### 🎯 Key Takeaways

1. **Test Pyramid**: 70% Unit, 20% Integration, 10% E2E
2. **Automation**: Automate testing trong CI/CD pipeline
3. **Coverage**: Aim for 80%+ code coverage
4. **Performance**: Monitor Core Web Vitals (FCP, LCP, CLS)
5. **Security**: Regular scans với OWASP ZAP, Snyk
6. **Error Tracking**: Sentry trong production để catch bugs sớm
7. **Debugging**: Use proper tools (DevTools, VS Code debugger) thay vì console.log
8. **QA Checklist**: Follow checklist trước mỗi production deployment

### 📚 Testing Tools Summary

| Category | Tools | Use Case |
|----------|-------|----------|
| **Unit** | Jest, Vitest | Test functions/components riêng lẻ |
| **Integration** | Jest + MSW | Test API integration, workflows |
| **E2E** | Playwright, Cypress | Test user flows trong browser |
| **Performance** | Lighthouse, k6 | Test speed, load capacity |
| **Security** | OWASP ZAP, Snyk | Find vulnerabilities |
| **Error Tracking** | Sentry, Rollbar | Monitor production errors |
| **Debugging** | Chrome DevTools, VS Code | Find and fix bugs |

### ⚡ Best Practices Recap

✅ **DO:**
- Write tests as you code (TDD approach)
- Test user behavior, not implementation details
- Mock external dependencies (APIs, databases)
- Use proper selectors (data-testid) cho stability
- Automate tests trong CI/CD
- Monitor production với error tracking
- Follow QA checklist trước deploy

❌ **DON'T:**
- Test implementation details (internal state)
- Write flaky tests (random failures)
- Hardcode wait times (`sleep(5000)`)
- Skip edge cases và error states
- Deploy without running full test suite
- Ignore production errors
- Skip accessibility testing

---

**Tiếp theo**: [Phần 6: Triển khai và Quản lý Ứng dụng →](./06-trien-khai-va-quan-ly-ung-dung.md)
