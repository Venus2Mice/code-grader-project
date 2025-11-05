# Phần 7: Bảo mật và Quyền riêng tư

## Tổng quan - Overview

**Bảo mật (Security)** và **Quyền riêng tư (Privacy)** là hai trụ cột quan trọng nhất trong phát triển ứng dụng web hiện đại. Theo báo cáo của OWASP (Open Web Application Security Project), hơn 90% ứng dụng web có ít nhất một lỗ hổng bảo mật nghiêm trọng. Việc implement security từ đầu (Security by Design) không chỉ bảo vệ dữ liệu người dùng mà còn xây dựng lòng tin và tuân thủ pháp luật (GDPR, CCPA).

### 🎯 Mục tiêu của Phần này

1. **Authentication & Authorization**: Xác thực người dùng an toàn (JWT, OAuth 2.0, MFA)
2. **OWASP Top 10**: Phòng chống các lỗ hổng phổ biến nhất
3. **Data Protection**: Mã hóa dữ liệu (at-rest, in-transit)
4. **Privacy Compliance**: Tuân thủ GDPR, CCPA
5. **Security Best Practices**: Security headers, rate limiting, audit logging

### 🛡️ Security Layers (Các lớp bảo mật)

```
┌─────────────────────────────────────────┐
│  Application Layer (Frontend)          │  ← XSS prevention, CSP
├─────────────────────────────────────────┤
│  API Layer (Backend)                    │  ← Authentication, Authorization, Rate limiting
├─────────────────────────────────────────┤
│  Data Layer (Database)                  │  ← Encryption at-rest, SQL injection prevention
├─────────────────────────────────────────┤
│  Network Layer (HTTPS/TLS)              │  ← Encryption in-transit, HSTS
├─────────────────────────────────────────┤
│  Infrastructure Layer (Cloud/Server)    │  ← Firewall, DDoS protection, VPN
└─────────────────────────────────────────┘
```

---

## 7.1. Authentication - Xác thực Người dùng

### 7.1.1. Password Security - Bảo mật Mật khẩu

**Password requirements** (Yêu cầu mật khẩu):
- Tối thiểu 8 ký tự
- Bao gồm: chữ hoa, chữ thường, số, ký tự đặc biệt
- Không dùng mật khẩu phổ biến (e.g., "Password123!")
- Hash với bcrypt (cost factor >= 12)

#### Secure Password Handling

```typescript
// utils/password.ts
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export class PasswordUtils {
  private static readonly SALT_ROUNDS = 12;
  private static readonly MIN_PASSWORD_LENGTH = 8;

  static async hash(password: string): Promise<string> {
    this.validatePassword(password);
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static validatePassword(password: string): void {
    if (password.length < this.MIN_PASSWORD_LENGTH) {
      throw new Error(`Password must be at least ${this.MIN_PASSWORD_LENGTH} characters`);
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecial) {
      throw new Error(
        'Password must contain uppercase, lowercase, number, and special character'
      );
    }
  }

  static generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
```

**Password strength checker:**

```typescript
// utils/passwordStrength.ts
export enum PasswordStrength {
  WEAK = 'weak',
  MEDIUM = 'medium',
  STRONG = 'strong',
  VERY_STRONG = 'very_strong',
}

export function checkPasswordStrength(password: string): PasswordStrength {
  let score = 0;

  // Length scoring
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;

  // Character diversity
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  // Patterns (deduct points)
  if (/(.)\1{2,}/.test(password)) score--; // Repeated characters
  if (/^[a-zA-Z]+$/.test(password)) score--; // Only letters

  if (score <= 2) return PasswordStrength.WEAK;
  if (score <= 4) return PasswordStrength.MEDIUM;
  if (score <= 6) return PasswordStrength.STRONG;
  return PasswordStrength.VERY_STRONG;
}
```

---

### 7.1.2. JWT (JSON Web Tokens) - Authentication Strategy

**JWT là gì?**  
JWT là một chuẩn mở (RFC 7519) để truyền thông tin an toàn giữa các bên dưới dạng JSON object. JWT được sử dụng rộng rãi cho authentication trong REST APIs.

**JWT Structure:**
```
Header.Payload.Signature

Header (Base64):
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload (Base64):
{
  "userId": "123",
  "email": "user@example.com",
  "role": "admin",
  "iat": 1635724800,  // Issued at
  "exp": 1635728400   // Expiration
}

Signature:
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

#### JWT Implementation

```typescript
// lib/jwt.ts
import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export class JWTService {
  private static readonly ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET!;
  private static readonly REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET!;
  private static readonly ACCESS_TOKEN_EXPIRY = '15m';
  private static readonly REFRESH_TOKEN_EXPIRY = '7d';

  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.ACCESS_TOKEN_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
    });
  }

  static generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.REFRESH_TOKEN_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY,
    });
  }

  static verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.ACCESS_TOKEN_SECRET) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  static verifyRefreshToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.REFRESH_TOKEN_SECRET) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  static decodeToken(token: string): TokenPayload | null {
    return jwt.decode(token) as TokenPayload | null;
  }
}
```

**Refresh Token Strategy** (để tránh re-login thường xuyên):

```typescript
// pages/api/auth/refresh.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { JWTService } from '@/lib/jwt';
import { db } from '@/lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  try {
    // Verify refresh token
    const payload = JWTService.verifyRefreshToken(refreshToken);

    // Check if token is in database (not revoked)
    const storedToken = await db('refresh_tokens')
      .where({ token: refreshToken, user_id: payload.userId })
      .first();

    if (!storedToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Generate new access token
    const newAccessToken = JWTService.generateAccessToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    });

    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
}
```

**JWT Best Practices:**
- ✅ Use short expiration for access tokens (15 minutes)
- ✅ Use longer expiration for refresh tokens (7 days)
- ✅ Store refresh tokens in database (để revoke khi cần)
- ✅ Use HTTPS only (prevent token interception)
- ✅ Store tokens in httpOnly cookies (không trong localStorage - XSS risk)
- ❌ Don't store sensitive data in JWT payload (it's only Base64 encoded, not encrypted)

---

### 7.1.3. OAuth 2.0 & Social Login

**OAuth 2.0 Flow** (Authorization Code Flow):

```
User → Click "Login with Google"
  ↓
App → Redirect to Google Authorization Server
  ↓
User → Authenticate với Google & Grant permission
  ↓
Google → Redirect back to App với Authorization Code
  ↓
App → Exchange code for Access Token (backend)
  ↓
App → Use Access Token to fetch user profile
  ↓
App → Create/update user in database
  ↓
App → Generate JWT for user
```

**Implementation với NextAuth.js:**

```typescript
// pages/api/auth/[...nextauth].ts
import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/database';
import { PasswordUtils } from '@/utils/password';

export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),

    // GitHub OAuth
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),

    // Email/Password
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        const user = await db('users')
          .where('email', credentials.email)
          .first();

        if (!user) {
          throw new Error('User not found');
        }

        const isValid = await PasswordUtils.verify(
          credentials.password,
          user.password_hash
        );

        if (!isValid) {
          throw new Error('Invalid password');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      // Save OAuth user to database
      if (account?.provider !== 'credentials') {
        const existingUser = await db('users')
          .where('email', user.email)
          .first();

        if (!existingUser) {
          await db('users').insert({
            email: user.email,
            name: user.name,
            avatar: user.image,
            provider: account.provider,
            provider_id: account.providerAccountId,
            email_verified: true,
            created_at: new Date(),
          });
        }
      }

      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

export default NextAuth(authOptions);
```

**Frontend usage:**

```typescript
// components/LoginButton.tsx
import { signIn, signOut, useSession } from 'next-auth/react';

export const LoginButton = () => {
  const { data: session } = useSession();

  if (session) {
    return (
      <div>
        <p>Welcome, {session.user?.name}</p>
        <button onClick={() => signOut()}>Sign out</button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => signIn('google')}>
        Sign in with Google
      </button>
      <button onClick={() => signIn('github')}>
        Sign in with GitHub
      </button>
    </div>
  );
};
```

---

#### Multi-Factor Authentication (MFA)

```typescript
// services/mfaService.ts
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export class MFAService {
  static generateSecret(email: string) {
    const secret = speakeasy.generateSecret({
      name: `MyApp (${email})`,
      length: 32,
    });

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
    };
  }

  static async generateQRCode(otpauthUrl: string): Promise<string> {
    return QRCode.toDataURL(otpauthUrl);
  }

  static verifyToken(token: string, secret: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2,
    });
  }

  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }
}
```

**MFA Workflow:**

```
1. User enables MFA in settings
   ↓
2. Backend generates secret (base32)
   ↓
3. Backend generates QR code from otpauth URL
   ↓
4. User scans QR code với Authenticator app (Google Authenticator, Authy)
   ↓
5. User enters 6-digit code to verify setup
   ↓
6. Backend saves secret to database (encrypted)
   ↓
7. Backup codes generated and shown to user
   ↓
8. On future logins:
   - User enters email/password (first factor)
   - User enters 6-digit TOTP code (second factor)
   - Backend verifies code with stored secret
   - Login successful if valid
```

**MFA API endpoints:**

```typescript
// pages/api/user/mfa/enable.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { MFAService } from '@/services/mfaService';
import { db } from '@/lib/database';
import { Encryption } from '@/utils/encryption';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const userId = (req as any).user.id;
  const email = (req as any).user.email;

  // Generate secret and QR code
  const { secret, otpauthUrl } = MFAService.generateSecret(email);
  const qrCode = await MFAService.generateQRCode(otpauthUrl);

  // Don't save yet - user must verify first
  res.status(200).json({
    secret, // Show this to user for manual entry
    qrCode, // Display this QR code
  });
}

// pages/api/user/mfa/verify-enable.ts
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const userId = (req as any).user.id;
  const { secret, token } = req.body;

  // Verify token
  const isValid = MFAService.verifyToken(token, secret);

  if (!isValid) {
    return res.status(400).json({ error: 'Invalid verification code' });
  }

  // Generate backup codes
  const backupCodes = MFAService.generateBackupCodes();

  // Save encrypted secret and backup codes
  await db('users').where('id', userId).update({
    mfa_secret: Encryption.encrypt(secret),
    mfa_enabled: true,
    mfa_backup_codes: JSON.stringify(
      backupCodes.map((code) => Encryption.encrypt(code))
    ),
  });

  res.status(200).json({
    message: 'MFA enabled successfully',
    backupCodes, // Show once, user must save them
  });
}

// pages/api/auth/login-mfa.ts
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { email, password, mfaToken } = req.body;

  // Step 1: Verify email/password
  const user = await db('users').where('email', email).first();
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isValidPassword = await PasswordUtils.verify(password, user.password_hash);
  
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Step 2: Check if MFA enabled
  if (!user.mfa_enabled) {
    // MFA not enabled, login directly
    const token = JWTService.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return res.status(200).json({ token });
  }

  // Step 3: Verify MFA token
  if (!mfaToken) {
    return res.status(200).json({
      mfaRequired: true,
      message: 'Please enter your 6-digit code',
    });
  }

  const decryptedSecret = Encryption.decrypt(user.mfa_secret);
  const isValidMFA = MFAService.verifyToken(mfaToken, decryptedSecret);

  if (!isValidMFA) {
    // Check backup codes
    const backupCodes = JSON.parse(user.mfa_backup_codes || '[]');
    const isBackupCode = backupCodes.some((encryptedCode: string) => {
      const code = Encryption.decrypt(encryptedCode);
      return code === mfaToken;
    });

    if (!isBackupCode) {
      return res.status(401).json({ error: 'Invalid MFA code' });
    }

    // Remove used backup code
    const updatedCodes = backupCodes.filter((encryptedCode: string) => {
      return Encryption.decrypt(encryptedCode) !== mfaToken;
    });

    await db('users').where('id', user.id).update({
      mfa_backup_codes: JSON.stringify(updatedCodes),
    });
  }

  // MFA verified, login successful
  const token = JWTService.generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  res.status(200).json({ token });
}
```

---

## 7.2. Authorization - Phân quyền

### 7.2.1. Role-Based Access Control (RBAC)

```typescript
// middleware/rbac.ts
import { NextApiRequest, NextApiResponse } from 'next';

export enum Role {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator',
  GUEST = 'guest',
}

export enum Permission {
  READ_USERS = 'read:users',
  WRITE_USERS = 'write:users',
  DELETE_USERS = 'delete:users',
  READ_POSTS = 'read:posts',
  WRITE_POSTS = 'write:posts',
  DELETE_POSTS = 'delete:posts',
}

const rolePermissions: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    Permission.READ_USERS,
    Permission.WRITE_USERS,
    Permission.DELETE_USERS,
    Permission.READ_POSTS,
    Permission.WRITE_POSTS,
    Permission.DELETE_POSTS,
  ],
  [Role.MODERATOR]: [
    Permission.READ_USERS,
    Permission.READ_POSTS,
    Permission.WRITE_POSTS,
    Permission.DELETE_POSTS,
  ],
  [Role.USER]: [
    Permission.READ_POSTS,
    Permission.WRITE_POSTS,
  ],
  [Role.GUEST]: [
    Permission.READ_POSTS,
  ],
};

export class RBAC {
  static hasPermission(role: Role, permission: Permission): boolean {
    const permissions = rolePermissions[role] || [];
    return permissions.includes(permission);
  }

  static requirePermission(permission: Permission) {
    return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
      const user = (req as any).user;

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!this.hasPermission(user.role, permission)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      next();
    };
  }

  static requireRole(requiredRole: Role) {
    return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
      const user = (req as any).user;

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (user.role !== requiredRole) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      next();
    };
  }
}
```

**RBAC vs ABAC (Attribute-Based Access Control):**

| Aspect | RBAC | ABAC |
|--------|------|------|
| **Concept** | User → Role → Permissions | User attributes + Resource attributes + Environment |
| **Flexibility** | Low (predefined roles) | High (dynamic policies) |
| **Scalability** | Good for < 100 roles | Excellent for complex scenarios |
| **Example** | "Admin can delete users" | "Manager can delete posts if author is in same department AND post < 7 days old" |
| **Use Cases** | Simple apps, internal tools | Enterprise apps, multi-tenant SaaS |

**RBAC Usage trong API routes:**

```typescript
// pages/api/admin/users.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { RBAC, Permission } from '@/middleware/rbac';
import { withAuth } from '@/middleware/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // This code only runs if user has Permission.WRITE_USERS
  const users = await db('users').select('*');
  res.status(200).json(users);
}

export default withAuth(
  RBAC.requirePermission(Permission.WRITE_USERS)(handler)
);
```

---

### 7.2.2. Attribute-Based Access Control (ABAC)

**ABAC Implementation** (cho complex scenarios):

```typescript
// lib/abac.ts
interface Policy {
  effect: 'allow' | 'deny';
  actions: string[];
  resources: string[];
  conditions?: Condition[];
}

interface Condition {
  attribute: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'in' | 'contains';
  value: any;
}

interface Context {
  user: {
    id: string;
    role: string;
    department: string;
    [key: string]: any;
  };
  resource: {
    id: string;
    type: string;
    ownerId?: string;
    department?: string;
    [key: string]: any;
  };
  environment: {
    time: Date;
    ipAddress: string;
    [key: string]: any;
  };
}

export class ABAC {
  private policies: Policy[] = [];

  addPolicy(policy: Policy) {
    this.policies.push(policy);
  }

  evaluate(action: string, context: Context): boolean {
    let result = false;

    for (const policy of this.policies) {
      if (!this.matchesAction(action, policy.actions)) continue;
      if (!this.matchesResource(context.resource.type, policy.resources)) continue;
      if (!this.evaluateConditions(policy.conditions || [], context)) continue;

      if (policy.effect === 'allow') {
        result = true;
      } else if (policy.effect === 'deny') {
        return false; // Deny takes precedence
      }
    }

    return result;
  }

  private matchesAction(action: string, allowedActions: string[]): boolean {
    return allowedActions.includes('*') || allowedActions.includes(action);
  }

  private matchesResource(resourceType: string, allowedResources: string[]): boolean {
    return allowedResources.includes('*') || allowedResources.includes(resourceType);
  }

  private evaluateConditions(conditions: Condition[], context: Context): boolean {
    return conditions.every((condition) => {
      const value = this.getAttributeValue(condition.attribute, context);
      return this.evaluateCondition(value, condition.operator, condition.value);
    });
  }

  private getAttributeValue(attribute: string, context: Context): any {
    const [domain, ...path] = attribute.split('.');
    
    if (domain === 'user') {
      return path.reduce((obj, key) => obj?.[key], context.user as any);
    } else if (domain === 'resource') {
      return path.reduce((obj, key) => obj?.[key], context.resource as any);
    } else if (domain === 'environment') {
      return path.reduce((obj, key) => obj?.[key], context.environment as any);
    }
    
    return undefined;
  }

  private evaluateCondition(value: any, operator: string, target: any): boolean {
    switch (operator) {
      case 'eq':
        return value === target;
      case 'ne':
        return value !== target;
      case 'gt':
        return value > target;
      case 'lt':
        return value < target;
      case 'in':
        return Array.isArray(target) && target.includes(value);
      case 'contains':
        return String(value).includes(String(target));
      default:
        return false;
    }
  }
}

// Example usage
const abac = new ABAC();

// Policy: Users can edit their own posts
abac.addPolicy({
  effect: 'allow',
  actions: ['edit', 'delete'],
  resources: ['post'],
  conditions: [
    { attribute: 'user.id', operator: 'eq', value: 'resource.ownerId' },
  ],
});

// Policy: Managers can edit posts in their department
abac.addPolicy({
  effect: 'allow',
  actions: ['edit', 'delete'],
  resources: ['post'],
  conditions: [
    { attribute: 'user.role', operator: 'eq', value: 'manager' },
    { attribute: 'user.department', operator: 'eq', value: 'resource.department' },
  ],
});

// Policy: Admins can do anything
abac.addPolicy({
  effect: 'allow',
  actions: ['*'],
  resources: ['*'],
  conditions: [
    { attribute: 'user.role', operator: 'eq', value: 'admin' },
  ],
});

// Check authorization
const canEdit = abac.evaluate('edit', {
  user: { id: '123', role: 'user', department: 'engineering' },
  resource: { id: '456', type: 'post', ownerId: '123', department: 'engineering' },
  environment: { time: new Date(), ipAddress: '192.168.1.1' },
});
```

---

## 7.3. OWASP Top 10 - Phòng chống Lỗ hổng Bảo mật

### 7.3.1. A01:2021 – Broken Access Control

**Lỗ hổng**: Người dùng có thể truy cập tài nguyên không được phép.

**Phòng chống**:

```typescript
// ❌ WRONG - Insecure Direct Object Reference (IDOR)
// pages/api/posts/[id].ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const postId = req.query.id;
  const post = await db('posts').where('id', postId).first();
  res.json(post); // Anyone can access any post!
}

// ✅ CORRECT - Check ownership
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const postId = req.query.id;
  const userId = (req as any).user.id;

  const post = await db('posts')
    .where('id', postId)
    .first();

  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  // Check if user owns the post OR is admin
  if (post.user_id !== userId && (req as any).user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.json(post);
}
```

---

### 7.3.2. A02:2021 – Cryptographic Failures

**Lỗ hổng**: Dữ liệu nhạy cảm bị lộ do không mã hóa hoặc mã hóa yếu.

**Phòng chống**:

```typescript
// ✅ Always use HTTPS in production
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
};

// ✅ Encrypt sensitive data before storing
import { Encryption } from '@/utils/encryption';

await db('users').insert({
  email: user.email,
  ssn: Encryption.encrypt(user.ssn), // Social Security Number
  creditCard: Encryption.encrypt(user.creditCard),
});

// ✅ Hash passwords (never store plaintext)
import bcrypt from 'bcrypt';

const hashedPassword = await bcrypt.hash(password, 12);
await db('users').insert({ email, password_hash: hashedPassword });
```

---

### 7.3.3. A03:2021 – Injection (SQL, NoSQL, Command)

**SQL Injection Prevention:**

```typescript
// Use parameterized queries
import { db } from '@/lib/database';

// ❌ WRONG - SQL Injection vulnerability
const userId = req.query.id;
const user = await db.raw(`SELECT * FROM users WHERE id = ${userId}`);
// Attacker can inject: "1 OR 1=1; DROP TABLE users--"

// ✅ CORRECT - Parameterized query
const userId = req.query.id;
const user = await db.raw('SELECT * FROM users WHERE id = ?', [userId]);

// ✅ CORRECT - ORM query builder (best)
const user = await db('users').where('id', userId).first();
```

**Input Validation và Sanitization:**

```typescript
// utils/validation.ts
import validator from 'validator';
import DOMPurify from 'isomorphic-dompurify';

export class ValidationUtils {
  static sanitizeEmail(email: string): string {
    return validator.normalizeEmail(email.trim().toLowerCase()) || '';
  }

  static validateEmail(email: string): boolean {
    return validator.isEmail(email);
  }

  static sanitizeHtml(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      ALLOWED_ATTR: ['href', 'title'],
    });
  }

  static sanitizeString(input: string): string {
    return validator.escape(input.trim());
  }

  static validateUrl(url: string): boolean {
    return validator.isURL(url, {
      protocols: ['http', 'https'],
      require_protocol: true,
    });
  }

  static validatePhoneNumber(phone: string): boolean {
    return validator.isMobilePhone(phone, 'any');
  }

  static validateCreditCard(card: string): boolean {
    return validator.isCreditCard(card);
  }

  static sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  }
}
```

**Schema validation với Zod:**

```typescript
// lib/validation/schemas.ts
import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(10).max(10000),
  tags: z.array(z.string()).max(10),
  published: z.boolean().optional(),
  publishedAt: z.date().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  bio: z.string().max(500).optional(),
  website: z.string().url().optional(),
});

// Usage in API route
import { createPostSchema } from '@/lib/validation/schemas';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const validated = createPostSchema.parse(req.body);
    
    // validated is now type-safe and sanitized
    const post = await db('posts').insert(validated);
    res.status(201).json(post);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    throw error;
  }
}
```

**Command Injection Prevention:**

```typescript
// ❌ WRONG - Command injection vulnerability
const filename = req.body.filename;
exec(`convert ${filename} output.png`); // Attacker can inject: "file.jpg; rm -rf /"

// ✅ CORRECT - Use libraries instead of shell commands
import sharp from 'sharp';

await sharp(filename).resize(800, 600).toFile('output.png');

// If you MUST use exec, sanitize heavily
import { execFile } from 'child_process';

// execFile doesn't spawn a shell, safer
execFile('convert', [filename, 'output.png']);
```

---

### 7.3.4. A04:2021 – Insecure Design

**Lỗ hổng**: Thiếu suy nghĩ về security trong thiết kế (e.g., không có rate limiting, không có account lockout).

**Phòng chống - Account lockout after failed login attempts:**

```typescript
// pages/api/auth/login.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { email, password } = req.body;

  const user = await db('users').where('email', email).first();

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Check if account is locked
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const minutesLeft = Math.ceil(
      (new Date(user.locked_until).getTime() - Date.now()) / 60000
    );
    return res.status(403).json({
      error: `Account locked. Try again in ${minutesLeft} minutes`,
    });
  }

  // Verify password
  const isValid = await PasswordUtils.verify(password, user.password_hash);

  if (!isValid) {
    // Increment failed attempts
    const failedAttempts = (user.failed_login_attempts || 0) + 1;
    const updates: any = { failed_login_attempts: failedAttempts };

    // Lock account after 5 failed attempts
    if (failedAttempts >= 5) {
      updates.locked_until = new Date(Date.now() + 15 * 60 * 1000); // 15 min
    }

    await db('users').where('id', user.id).update(updates);

    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Reset failed attempts on successful login
  await db('users').where('id', user.id).update({
    failed_login_attempts: 0,
    locked_until: null,
    last_login_at: new Date(),
  });

  const token = JWTService.generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  res.status(200).json({ token });
}
```

---

### 7.3.5. A05:2021 – Security Misconfiguration

**Lỗ hổng**: Default credentials, unnecessary features enabled, verbose error messages.

**Phòng chống:**

```typescript
// ❌ WRONG - Exposing stack traces in production
app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.message,
    stack: err.stack, // DON'T expose stack traces!
  });
});

// ✅ CORRECT - Generic error messages in production
app.use((err, req, res, next) => {
  // Log full error server-side
  logger.error('API Error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  // Send generic message to client
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({
      error: 'Internal server error',
      requestId: req.id, // For support to trace
    });
  } else {
    // Show details in development
    res.status(500).json({
      error: err.message,
      stack: err.stack,
    });
  }
});
```

**Security Configuration Checklist:**

- [ ] Remove default credentials (admin/admin)
- [ ] Disable unnecessary features (directory listing, debug mode)
- [ ] Keep dependencies up-to-date (`npm audit fix`)
- [ ] Use environment variables for secrets (không hardcode)
- [ ] Disable verbose error messages in production
- [ ] Remove commented-out code và TODO comments before deploy
- [ ] Disable CORS for production (or whitelist specific domains)

---

### 7.3.6. A06:2021 – Vulnerable and Outdated Components

**Phòng chống:**

```bash
# Regular security audits
npm audit

# Fix automatically
npm audit fix

# Force update (might break things)
npm audit fix --force

# Check for outdated packages
npm outdated

# Use Snyk for continuous monitoring
npx snyk test
npx snyk monitor

# GitHub Dependabot (automated PRs)
# See Part 6 - CI/CD section
```

---

### 7.3.7. A07:2021 – Identification and Authentication Failures

**Covered in Section 7.1** (JWT, OAuth, MFA, Password policies).

---

### 7.3.8. A08:2021 – Software and Data Integrity Failures

**Lỗ hổng**: Code hoặc infrastructure không được verify (e.g., CDN compromised).

**Phòng chống - Use Subresource Integrity (SRI) for CDN scripts:**

```html
<!-- ✅ SRI ensures script hasn't been tampered with -->
<script
  src="https://cdn.example.com/lib.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
  crossorigin="anonymous"
></script>
```

```bash
# Generate SRI hash
cat lib.js | openssl dgst -sha384 -binary | openssl base64 -A
```

**Use lock files to ensure dependency integrity:**

```bash
# Always commit package-lock.json or yarn.lock
git add package-lock.json
git commit -m "lock: update dependencies"

# Verify integrity during CI/CD
npm ci  # Uses package-lock.json exactly
```

---

### 7.3.9. A09:2021 – Security Logging and Monitoring Failures

**Audit Logging Service:**

```typescript
// services/auditService.ts
import { db } from '@/lib/database';

interface AuditLogEntry {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, any>;
}

export class AuditService {
  static async log(entry: AuditLogEntry): Promise<void> {
    await db('audit_logs').insert({
      ...entry,
      metadata: JSON.stringify(entry.metadata || {}),
      created_at: new Date(),
    });
  }

  static async getUserActivity(userId: string, limit: number = 100) {
    return db('audit_logs')
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .limit(limit);
  }

  static async getResourceActivity(resource: string, resourceId: string) {
    return db('audit_logs')
      .where({ resource, resource_id: resourceId })
      .orderBy('created_at', 'desc');
  }
}

// Usage in API route
await AuditService.log({
  userId: req.user.id,
  action: 'user.delete',
  resource: 'user',
  resourceId: deletedUserId,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  metadata: { reason: 'GDPR request' },
});
```

**Security Events to Log:**

- ✅ Failed login attempts
- ✅ Password changes
- ✅ Permission escalations
- ✅ Data exports/deletions
- ✅ API rate limit violations
- ✅ Suspicious activity (multiple IPs, unusual locations)

---

### 7.3.10. A10:2021 – Server-Side Request Forgery (SSRF)

**Lỗ hổng**: Attacker tricks server into making requests to internal resources.

**Phòng chống:**

```typescript
// ❌ WRONG - SSRF vulnerability
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.body;
  const response = await fetch(url); // Attacker can use: http://localhost:6379 (Redis)
  res.json(await response.json());
}

// ✅ CORRECT - Whitelist allowed domains
const ALLOWED_DOMAINS = ['api.github.com', 'api.twitter.com'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.body;
  
  const parsed = new URL(url);
  
  // Block private IP ranges
  if (
    parsed.hostname === 'localhost' ||
    parsed.hostname.startsWith('127.') ||
    parsed.hostname.startsWith('192.168.') ||
    parsed.hostname.startsWith('10.')
  ) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  // Check whitelist
  if (!ALLOWED_DOMAINS.includes(parsed.hostname)) {
    return res.status(403).json({ error: 'Domain not allowed' });
  }
  
  const response = await fetch(url);
  res.json(await response.json());
}
```

---

## 7.4. Security Headers - HTTP Security Headers

**Security headers** giúp protect ứng dụng khỏi nhiều loại tấn công (XSS, clickjacking, MIME sniffing).

### 7.4.1. CSRF Protection

**Cross-Site Request Forgery (CSRF)**: Attacker tricks user into submitting malicious request.

```typescript
// middleware/csrf.ts
import csrf from 'csurf';
import { NextApiRequest, NextApiResponse } from 'next';

const csrfProtection = csrf({ cookie: true });

export const withCSRF = (handler: any) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== 'GET') {
      await new Promise((resolve, reject) => {
        csrfProtection(req, res, (result: any) => {
          if (result instanceof Error) {
            return reject(result);
          }
          resolve(result);
        });
      });
    }

    return handler(req, res);
  };
};

// Usage in API route
export default withCSRF(async (req: NextApiRequest, res: NextApiResponse) => {
  // Handler logic - protected from CSRF
  const post = await db('posts').insert(req.body);
  res.status(201).json(post);
});
```

**CSRF Token trong Form:**

```typescript
// pages/api/csrf-token.ts
export default csrfProtection(async (req: NextApiRequest, res: NextApiResponse) => {
  res.json({ csrfToken: (req as any).csrfToken() });
});

// components/PostForm.tsx
import { useState, useEffect } from 'react';

export const PostForm = () => {
  const [csrfToken, setCsrfToken] = useState('');

  useEffect(() => {
    fetch('/api/csrf-token')
      .then((res) => res.json())
      .then((data) => setCsrfToken(data.csrfToken));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    await fetch('/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({ title, content }),
    });
  };

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
};
```

---

---

### 7.4.2. Comprehensive Security Headers

```typescript
// middleware/securityHeaders.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 1. X-Frame-Options: Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  // Alternative: 'SAMEORIGIN' if you need iframes from same domain

  // 2. X-Content-Type-Options: Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // 3. X-XSS-Protection: Enable browser XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // 4. Content Security Policy (CSP): Control resource loading
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'", // Only load from same origin by default
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://trusted-cdn.com", // Scripts
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // CSS
      "img-src 'self' data: https: blob:", // Images (allow data URIs, HTTPS, blobs)
      "font-src 'self' https://fonts.gstatic.com", // Fonts
      "connect-src 'self' https://api.example.com", // AJAX, WebSocket
      "frame-ancestors 'none'", // Don't allow embedding (similar to X-Frame-Options)
      "base-uri 'self'", // Restrict <base> tag
      "form-action 'self'", // Restrict form submissions
      "upgrade-insecure-requests", // Auto-upgrade HTTP to HTTPS
    ].join('; ')
  );

  // 5. Strict-Transport-Security (HSTS): Force HTTPS
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  // max-age=31536000: 1 year
  // includeSubDomains: Apply to all subdomains
  // preload: Submit to HSTS preload list (browsers)

  // 6. Referrer-Policy: Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Options: no-referrer, no-referrer-when-downgrade, same-origin, origin, strict-origin

  // 7. Permissions-Policy: Control browser features
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );
  // Disable camera, microphone, geolocation, payment APIs

  // 8. X-Permitted-Cross-Domain-Policies: Control Adobe products
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');

  return response;
}

// Apply to all routes
export const config = {
  matcher: '/:path*',
};
```

**Security Headers Comparison Table:**

| Header | Purpose | Example Value | Impact |
|--------|---------|---------------|--------|
| **X-Frame-Options** | Prevent clickjacking | `DENY` or `SAMEORIGIN` | High |
| **X-Content-Type-Options** | Prevent MIME sniffing | `nosniff` | Medium |
| **X-XSS-Protection** | Enable XSS filter | `1; mode=block` | Medium (deprecated in modern browsers, CSP preferred) |
| **Content-Security-Policy** | Control resource loading | `default-src 'self'` | Very High |
| **Strict-Transport-Security** | Force HTTPS | `max-age=31536000` | High |
| **Referrer-Policy** | Control referrer info | `strict-origin-when-cross-origin` | Medium |
| **Permissions-Policy** | Control browser features | `camera=(), mic=()` | Medium |

**Test Security Headers:**

```bash
# Use securityheaders.com or Mozilla Observatory
curl -I https://yourapp.com | grep -i "x-frame-options\|content-security\|strict-transport"
```

---

## 7.5. Rate Limiting - Giới hạn Tốc độ Request
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '@/lib/redis';

export const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message?: string;
}) => {
  return rateLimit({
    store: new RedisStore({
      client: redis,
      prefix: 'rate-limit:',
    }),
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Different limiters for different endpoints
export const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again after 15 minutes',
});

export const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests
});

export const strictLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests
});
```

### 7.1.6. Security Headers

```typescript
// middleware/securityHeaders.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // XSS Protection
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://trusted-cdn.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://api.example.com",
      "frame-ancestors 'none'",
    ].join('; ')
  );

  // Strict Transport Security
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  return response;
}
```

## 7.2. Quyền riêng tư và Tuân thủ

### 7.2.1. GDPR Compliance

#### Data Collection Consent

```typescript
// components/CookieConsent.tsx
import { useState, useEffect } from 'react';

export const CookieConsent: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShow(false);
    // Initialize analytics
    initializeAnalytics();
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="cookie-consent">
      <p>
        We use cookies to improve your experience. By using our site, you agree
        to our use of cookies.
      </p>
      <button onClick={handleAccept}>Accept</button>
      <button onClick={handleDecline}>Decline</button>
    </div>
  );
};
```

#### Data Export (Right to Data Portability)

```typescript
// pages/api/user/export-data.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const userId = (req as any).user.id;

  // Gather all user data
  const userData = await db('users').where('id', userId).first();
  const userPosts = await db('posts').where('user_id', userId);
  const userComments = await db('comments').where('user_id', userId);
  const userSettings = await db('user_settings').where('user_id', userId).first();

  const exportData = {
    user: userData,
    posts: userPosts,
    comments: userComments,
    settings: userSettings,
    exportedAt: new Date().toISOString(),
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="user-data-${userId}.json"`
  );
  res.status(200).json(exportData);
}
```

#### Data Deletion (Right to be Forgotten)

```typescript
// pages/api/user/delete-account.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const userId = (req as any).user.id;

  await db.transaction(async (trx) => {
    // Anonymize or delete user data
    await trx('users')
      .where('id', userId)
      .update({
        email: `deleted-${userId}@example.com`,
        name: 'Deleted User',
        deleted_at: new Date(),
      });

    // Delete related data
    await trx('posts').where('user_id', userId).del();
    await trx('comments').where('user_id', userId).del();
    await trx('user_settings').where('user_id', userId).del();
  });

  res.status(200).json({ message: 'Account deleted successfully' });
}
```

### 7.2.2. Data Encryption

#### Encryption at Rest

```typescript
// utils/encryption.ts
import crypto from 'crypto';

export class Encryption {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

  static encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.ALGORITHM, this.KEY, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  static decrypt(encryptedText: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(this.ALGORITHM, this.KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

**When to encrypt:**

- ✅ **Always encrypt**: Passwords (use bcrypt/argon2), SSN, credit cards, health data, API keys
- ✅ **Consider encrypting**: Email addresses, phone numbers, addresses (for GDPR compliance)
- ❌ **Don't encrypt**: User IDs, timestamps, public data (unnecessary overhead)

---

### 7.6.2. Encryption in Transit (HTTPS/TLS)

**Force HTTPS với Nginx:**

```nginx
# nginx.conf
server {
    listen 80;
    server_name example.com;
    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com;

    # SSL certificate (use Let's Encrypt for free certs)
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # Only allow TLS 1.2 and 1.3 (disable older versions)
    ssl_protocols TLSv1.2 TLSv1.3;

    # Use strong ciphers
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers on;

    # Enable OCSP stapling
    ssl_stapling on;
    ssl_stapling_verify on;

    # Session tickets
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Get free SSL certificate với Let's Encrypt:**

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d example.com -d www.example.com

# Auto-renewal (certbot adds this to cron)
sudo certbot renew --dry-run
```

**Test SSL configuration:**

```bash
# Use SSL Labs
# https://www.ssllabs.com/ssltest/

# Or use testssl.sh
git clone https://github.com/drwetter/testssl.sh
cd testssl.sh
./testssl.sh https://example.com
```

---

## 7.7. Privacy & GDPR Compliance - Quyền riêng tư

### 7.7.1. GDPR Principles

**GDPR (General Data Protection Regulation)** áp dụng cho tất cả ứng dụng có người dùng EU.

**Key Principles:**

1. **Lawfulness, fairness, transparency**: Thu thập dữ liệu phải hợp pháp, công bằng, minh bạch
2. **Purpose limitation**: Chỉ thu thập dữ liệu cho mục đích cụ thể
3. **Data minimization**: Thu thập ít dữ liệu nhất có thể
4. **Accuracy**: Dữ liệu phải chính xác và cập nhật
5. **Storage limitation**: Chỉ lưu trữ dữ liệu trong thời gian cần thiết
6. **Integrity and confidentiality**: Bảo mật dữ liệu
7. **Accountability**: Chịu trách nhiệm về dữ liệu

**User Rights under GDPR:**

- ✅ **Right to Access**: Xem dữ liệu cá nhân
- ✅ **Right to Rectification**: Sửa dữ liệu sai
- ✅ **Right to Erasure** ("Right to be Forgotten"): Xóa dữ liệu
- ✅ **Right to Data Portability**: Export dữ liệu
- ✅ **Right to Object**: Từ chối xử lý dữ liệu
- ✅ **Right to Restrict Processing**: Hạn chế xử lý

---

### 7.7.2. Cookie Consent Implementation

```typescript
// components/CookieConsent.tsx
import { useState, useEffect } from 'react';
import { setCookie, getCookie } from 'cookies-next';

export const CookieConsent = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = getCookie('cookie-consent');
    if (!consent) {
      setShow(true);
    } else if (consent === 'accepted') {
      initializeAnalytics();
    }
  }, []);

  const handleAccept = () => {
    setCookie('cookie-consent', 'accepted', {
      maxAge: 365 * 24 * 60 * 60, // 1 year
    });
    setShow(false);
    initializeAnalytics();
  };

  const handleDecline = () => {
    setCookie('cookie-consent', 'declined', {
      maxAge: 365 * 24 * 60 * 60,
    });
    setShow(false);
  };

  const handleCustomize = () => {
    // Show detailed cookie settings
    window.location.href = '/cookie-settings';
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-bold mb-2">We use cookies</h3>
          <p className="text-sm text-gray-300">
            We use cookies to improve your experience, analyze traffic, and for
            marketing. By clicking "Accept", you consent to our use of cookies.
            <a href="/privacy-policy" className="underline ml-1">
              Learn more
            </a>
          </p>
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={handleDecline}
            className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
          >
            Decline
          </button>
          <button
            onClick={handleCustomize}
            className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
          >
            Customize
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
};

function initializeAnalytics() {
  // Initialize Google Analytics, etc.
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('consent', 'update', {
      analytics_storage: 'granted',
    });
  }
}
```

---

### 7.7.3. Data Export (Right to Data Portability)

```typescript
// pages/api/user/export-data.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';
import { withAuth } from '@/middleware/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = (req as any).user.id;

  // Gather all user data from various tables
  const userData = await db('users').where('id', userId).first();
  const userPosts = await db('posts').where('user_id', userId);
  const userComments = await db('comments').where('user_id', userId);
  const userSettings = await db('user_settings').where('user_id', userId).first();
  const loginHistory = await db('login_history').where('user_id', userId).orderBy('created_at', 'desc').limit(100);

  // Remove sensitive fields
  delete userData.password_hash;
  delete userData.mfa_secret;

  const exportData = {
    user: userData,
    posts: userPosts,
    comments: userComments,
    settings: userSettings,
    loginHistory,
    exportedAt: new Date().toISOString(),
    format: 'JSON',
    version: '1.0',
  };

  // Set headers for download
  res.setHeader('Content-Type', 'application/json');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="my-data-${userId}-${Date.now()}.json"`
  );
  
  res.status(200).json(exportData);
}

export default withAuth(handler);
```

---

### 7.7.4. Account Deletion (Right to be Forgotten)

```typescript
// pages/api/user/delete-account.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';
import { withAuth } from '@/middleware/auth';
import { AuditService } from '@/services/auditService';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = (req as any).user.id;
  const { confirmPassword } = req.body;

  // Verify password before deletion
  const user = await db('users').where('id', userId).first();
  const isValidPassword = await PasswordUtils.verify(confirmPassword, user.password_hash);

  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  await db.transaction(async (trx) => {
    // Log deletion for compliance
    await AuditService.log({
      userId,
      action: 'account.delete',
      resource: 'user',
      resourceId: userId,
      ipAddress: req.socket.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
      metadata: { reason: 'User requested deletion (GDPR)' },
    });

    // Option 1: Hard delete (completely remove)
    // await trx('users').where('id', userId).del();
    // await trx('posts').where('user_id', userId).del();
    // await trx('comments').where('user_id', userId).del();

    // Option 2: Soft delete (anonymize, keep for data integrity)
    await trx('users').where('id', userId).update({
      email: `deleted-${userId}@deleted.local`,
      name: 'Deleted User',
      password_hash: null,
      avatar: null,
      mfa_secret: null,
      deleted_at: new Date(),
    });

    // Keep posts/comments but mark as deleted
    await trx('posts').where('user_id', userId).update({
      user_id: null,
      author_name: 'Deleted User',
    });

    await trx('comments').where('user_id', userId).update({
      user_id: null,
      author_name: 'Deleted User',
    });

    // Delete sensitive data
    await trx('user_settings').where('user_id', userId).del();
    await trx('user_sessions').where('user_id', userId).del();
    await trx('refresh_tokens').where('user_id', userId).del();
  });

  res.status(200).json({ 
    message: 'Account deleted successfully',
    deletedAt: new Date().toISOString(),
  });
}

export default withAuth(handler);
```

---

## 7.8. Security Best Practices - Tổng kết

### 7.8.1. Security Checklist

**Authentication & Authorization:**
- [ ] Passwords hashed với bcrypt (cost >= 12)
- [ ] JWT tokens have short expiration (access: 15min, refresh: 7 days)
- [ ] MFA available for sensitive accounts
- [ ] OAuth 2.0 implemented correctly (no auth code in URL, use state parameter)
- [ ] RBAC or ABAC implemented
- [ ] Authorization checks on ALL API routes

**Input Validation:**
- [ ] All user inputs validated (Zod schemas)
- [ ] SQL queries use parameterized queries (no string concatenation)
- [ ] HTML content sanitized với DOMPurify
- [ ] File uploads restricted (file type, size, virus scan)
- [ ] API rate limiting enabled (different limits for different endpoints)

**Data Protection:**
- [ ] Sensitive data encrypted at rest (AES-256-GCM)
- [ ] HTTPS enforced (HSTS enabled)
- [ ] Secrets in environment variables (not hardcoded)
- [ ] TLS 1.2+ only (no TLS 1.0/1.1)
- [ ] Database backups encrypted

**Security Headers:**
- [ ] Content-Security-Policy configured
- [ ] X-Frame-Options: DENY or SAMEORIGIN
- [ ] X-Content-Type-Options: nosniff
- [ ] Strict-Transport-Security enabled
- [ ] CSRF protection enabled

**Privacy & Compliance:**
- [ ] Cookie consent banner implemented
- [ ] Privacy policy và Terms of Service published
- [ ] Data export endpoint (GDPR Right to Portability)
- [ ] Account deletion endpoint (GDPR Right to Erasure)
- [ ] Audit logging for sensitive actions

**Monitoring & Incident Response:**
- [ ] Security event logging (failed logins, permission changes)
- [ ] Alerts for suspicious activity
- [ ] Incident response plan documented
- [ ] Regular security audits (`npm audit`, Snyk)
- [ ] Dependencies updated regularly (Dependabot)

---

### 7.8.2. Security Testing

```bash
# 1. Dependency vulnerability scan
npm audit
npx snyk test

# 2. Static code analysis
npx eslint . --ext .ts,.tsx
npx semgrep --config=auto .

# 3. OWASP ZAP (penetration testing)
# See Part 5 - Testing

# 4. SSL/TLS configuration test
./testssl.sh https://yourapp.com

# 5. Security headers check
curl -I https://yourapp.com | grep -i "x-frame\|csp\|hsts"

# Or use online tools:
# - https://securityheaders.com
# - https://observatory.mozilla.org
```

---

### 7.8.3. Incident Response Plan

**When security incident occurs:**

```yaml
Phase 1 - Detection (Phát hiện):
  - Automated alerts (Sentry, CloudWatch)
  - User reports
  - Security audits
  - Time to detect: < 5 minutes (for critical)

Phase 2 - Containment (Ngăn chặn):
  - Isolate affected systems
  - Revoke compromised tokens/keys
  - Block malicious IPs
  - Enable maintenance mode if needed
  - Time to contain: < 30 minutes

Phase 3 - Investigation (Điều tra):
  - Check audit logs
  - Identify attack vector
  - Assess data breach scope
  - Preserve evidence
  - Time to investigate: 2-24 hours

Phase 4 - Eradication (Loại bỏ):
  - Remove malware/backdoors
  - Patch vulnerabilities
  - Update security rules
  - Time to eradicate: 1-3 days

Phase 5 - Recovery (Phục hồi):
  - Restore from clean backups
  - Verify system integrity
  - Monitor closely
  - Time to recover: 1-7 days

Phase 6 - Post-Incident (Sau sự cố):
  - Write post-mortem report
  - Notify affected users (if data breach)
  - Update security policies
  - Implement preventive measures
  - Review within 48 hours
```

**Who to notify:**
- **Internal**: CTO, Engineering team, Legal
- **External**: Affected users (email), Data protection authority (if GDPR breach within 72h)
- **Stakeholders**: Investors, Partners

---

## 7.9. Kết luận - Conclusion

**Bảo mật không phải là feature**, mà là **requirement** cho mọi ứng dụng web hiện đại.

### 🎯 Key Takeaways

1. **Defense in Depth**: Nhiều lớp bảo mật (application, network, data, infrastructure)
2. **Shift-Left Security**: Tích hợp security từ đầu development cycle, không phải cuối
3. **Least Privilege**: Chỉ cấp quyền tối thiểu cần thiết
4. **Assume Breach**: Luôn giả định hệ thống có thể bị tấn công, prepare accordingly
5. **Privacy by Design**: Tuân thủ GDPR/CCPA từ đầu, không phải retrofit sau

### 📊 Security Metrics to Track

- **Mean Time to Detect (MTTD)**: Thời gian phát hiện sự cố
- **Mean Time to Respond (MTTR)**: Thời gian xử lý sự cố
- **Vulnerability Count**: Số lỗ hổng bảo mật (critical/high/medium/low)
- **Patch Time**: Thời gian từ lúc phát hiện đến patch
- **Failed Login Rate**: Tỷ lệ login thất bại (detect brute-force)
- **API Rate Limit Violations**: Số lần vượt rate limit

### 🚀 Next Steps

1. **Immediate**: Implement authentication (JWT + MFA), HTTPS, Security headers
2. **Short-term** (1-2 weeks): Input validation, CSRF protection, Rate limiting
3. **Medium-term** (1 month): RBAC/ABAC, Data encryption, Audit logging
4. **Long-term**: GDPR compliance, Penetration testing, Security audits

---

**Tiếp theo**: [Phần 8: Tài liệu và Hướng dẫn Sử dụng →](./08-tai-lieu-va-huong-dan-su-dung.md)

**Ngày cập nhật**: 05/11/2025  
**Phiên bản**: 2.0
