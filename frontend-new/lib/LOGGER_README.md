# Frontend Logger System

## ⚠️ QUAN TRỌNG: Production Console Disabled

**Frontend này đã được cấu hình để HOÀN TOÀN TẮT console trong production.**

- ✅ Development: Logs đầy đủ cho debugging
- ✅ Production: Console HOÀN TOÀN TRỐNG (không có logs)
- ✅ Sensitive data: Tự động sanitized
- ✅ Security: Không leak thông tin

Xem chi tiết: [PRODUCTION_CONSOLE_SECURITY.md](../PRODUCTION_CONSOLE_SECURITY.md)

---

## Tổng quan

Hệ thống logging được thiết kế để:
- ✅ **Bảo mật**: Tự động che giấu thông tin nhạy cảm (token, password, API keys)
- ✅ **Chỉ log trong Development**: Production không log ra console để bảo vệ thông tin
- ✅ **Cấu trúc rõ ràng**: Có các level: DEBUG, INFO, WARN, ERROR
- ✅ **Dễ mở rộng**: Dễ dàng tích hợp với external logging services (Sentry, LogRocket, etc.)

## Cách sử dụng

### Import

```typescript
import { logger } from '@/lib/logger'
```

### Các phương thức logging

#### 1. Debug (chỉ development)
```typescript
logger.debug('Fetching user data', { userId: 123 })
```

#### 2. Info (chỉ development)
```typescript
logger.info('User logged in', { email: user.email, role: user.role })
```

#### 3. Warning
```typescript
logger.warn('API rate limit approaching', { remaining: 10 })
```

#### 4. Error (luôn log nhưng được sanitize)
```typescript
logger.error('Failed to fetch data', error, { userId: 123 })
```

### Nhóm logs lại với nhau

```typescript
logger.group('User Login Flow', () => {
  logger.debug('Validating credentials')
  logger.debug('Checking user permissions')
  logger.info('Login successful')
})
```

### Đo thời gian thực thi

```typescript
logger.time('Data Fetch')
await fetchData()
logger.timeEnd('Data Fetch')
```

### Log dạng bảng

```typescript
logger.table(users) // Chỉ development
```

## Tự động che giấu thông tin nhạy cảm

Logger tự động phát hiện và che các key chứa:
- `token`
- `password`
- `authorization`
- `secret`
- `apiKey`
- `api_key`

**Ví dụ:**
```typescript
const userData = {
  email: 'user@example.com',
  access_token: 'secret123',
  role: 'student'
}

logger.info('User data', userData)
// Output: { email: 'user@example.com', access_token: '[REDACTED]', role: 'student' }
```

## Environment Modes

### Development Mode
```env
NODE_ENV=development
```
- Tất cả logs đều hiển thị
- Console có màu sắc và format đẹp
- Hiển thị stack trace đầy đủ

### Production Mode
```env
NODE_ENV=production
```
- Chỉ log ERROR level
- Không hiển thị thông tin nhạy cảm
- Stack trace bị ẩn
- Console clean, không làm lộ logic nghiệp vụ

## Migration từ console.log

### ❌ Cũ (không an toàn)
```typescript
console.log('Token:', token)
console.log('User data:', user)
console.error('Error:', error)
```

### ✅ Mới (an toàn)
```typescript
logger.debug('Token saved successfully') // Không log token
logger.info('User logged in', { email: user.email, role: user.role })
logger.error('Login failed', error)
```

## Lợi ích

1. **Bảo mật**: Không bao giờ log token, password ra production
2. **Performance**: Production không tốn resources cho logging
3. **Debugging**: Development vẫn có đầy đủ thông tin
4. **Maintainability**: Dễ tìm và quản lý logs
5. **Scalability**: Dễ tích hợp monitoring tools

## Tích hợp với External Services

Dễ dàng mở rộng để gửi logs đến:

```typescript
// lib/logger.ts - Thêm vào class Logger

error(message: string, error?: Error | any, context?: LogContext): void {
  // ... existing code ...
  
  // Gửi đến Sentry (production only)
  if (!this.isDevelopment && typeof window !== 'undefined') {
    Sentry.captureException(error, {
      extra: this.sanitize(context)
    })
  }
}
```

## Testing

Logger không ảnh hưởng đến tests vì NODE_ENV=test sẽ tắt hầu hết logs.

## Best Practices

1. ✅ **Luôn dùng logger thay vì console**
2. ✅ **Thêm context hữu ích** (ids, states)
3. ✅ **Không log dữ liệu lớn** (file content, base64)
4. ✅ **Dùng đúng level**: debug cho dev, error cho production
5. ❌ **Không log trong loops** (tạo spam)
6. ❌ **Không log thông tin nhạy cảm** dù có sanitize

## Summary

- 🔒 **Secure by default**
- 🚀 **Production-ready**
- 🛠️ **Developer-friendly**
- 📊 **Easy to monitor**
