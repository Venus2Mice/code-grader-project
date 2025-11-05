# Phần 8: Tài liệu và Đào tạo

## 📚 Tổng quan - Overview

**Documentation** (Tài liệu) và **Training** (Đào tạo) là nền tảng quan trọng để đảm bảo team có thể collaborate hiệu quả, onboard nhanh chóng, và maintain code quality dài hạn. Theo nghiên cứu, **40% thời gian của developers** được dành để đọc và hiểu code - documentation tốt giúp giảm con số này đáng kể.

### 🎯 Mục tiêu

1. **Developer Experience (DX)**: Giảm onboarding time từ 4 tuần → 2 tuần
2. **Knowledge Sharing**: Tránh knowledge silos, document decisions
3. **API Clarity**: Clear API docs giúp frontend/backend integrate dễ dàng
4. **User Guidance**: End-user guides giúp adoption tăng
5. **Maintenance**: Code comments giúp refactor an toàn

### 📖 Documentation Types

```yaml
Documentation Layers:

1. Code-level Documentation:
   - Inline comments (// why, not what)
   - JSDoc/TSDoc (function signatures, params, returns)
   - Type definitions (TypeScript interfaces)

2. API Documentation:
   - OpenAPI/Swagger specs
   - Request/response examples
   - Authentication flows
   - Error codes

3. Architecture Documentation:
   - System diagrams (C4 model, UML)
   - Data flow diagrams
   - Database schemas
   - ADRs (Architecture Decision Records)

4. User Documentation:
   - User guides (how to use features)
   - FAQ (common questions)
   - Troubleshooting (common issues)
   - Video tutorials

5. Process Documentation:
   - Development workflow (Git, PR process)
   - Deployment procedures
   - Incident response playbooks
   - Onboarding checklists
```

### 🏗️ Documentation Tools

| Tool | Purpose | Use Case |
|------|---------|----------|
| **TSDoc** | Code documentation | Function/class comments |
| **Swagger/OpenAPI** | API documentation | REST API specs |
| **Storybook** | Component documentation | UI component library |
| **Docusaurus** | Static site generator | Documentation websites |
| **Mermaid** | Diagrams as code | Architecture diagrams |
| **Notion/Confluence** | Wiki | Team knowledge base |
| **Loom/Vimeo** | Video tutorials | Onboarding videos |

---

## 8.1. Code Documentation - Tài liệu Code

### 8.1.1. JSDoc/TSDoc Best Practices

**TSDoc** là chuẩn documentation cho TypeScript (tương tự JSDoc cho JavaScript).

#### Function Documentation

```typescript
/**
 * Fetches user profile from the database with caching
 * 
 * @param userId - The unique identifier for the user
 * @param options - Optional configuration for the query
 * @param options.includeDeleted - Include soft-deleted users (default: false)
 * @param options.forceRefresh - Bypass cache and fetch fresh data (default: false)
 * 
 * @returns A promise that resolves to the user object, or null if not found
 * 
 * @throws {DatabaseError} When database connection fails
 * @throws {ValidationError} When userId format is invalid
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const user = await getUserProfile('user-123');
 * 
 * // With options
 * const user = await getUserProfile('user-123', {
 *   includeDeleted: true,
 *   forceRefresh: true
 * });
 * ```
 * 
 * @see {@link updateUserProfile} for updating user data
 * @see {@link deleteUserProfile} for deleting user
 * 
 * @beta This API is still in beta and may change
 */
export async function getUserProfile(
  userId: string,
  options?: {
    includeDeleted?: boolean;
    forceRefresh?: boolean;
  }
): Promise<User | null> {
  // Implementation
}
```

#### Class Documentation

```typescript
/**
 * Service for managing user authentication and authorization
 * 
 * @remarks
 * This service handles JWT token generation, validation, and refresh.
 * It integrates with Redis for token blacklisting.
 * 
 * @example
 * ```typescript
 * const authService = new AuthService({
 *   jwtSecret: process.env.JWT_SECRET,
 *   tokenExpiry: 900 // 15 minutes
 * });
 * 
 * const token = await authService.login(email, password);
 * ```
 */
export class AuthService {
  private readonly jwtSecret: string;
  private readonly tokenExpiry: number;

  /**
   * Creates an instance of AuthService
   * 
   * @param config - Configuration options
   * @param config.jwtSecret - Secret key for JWT signing
   * @param config.tokenExpiry - Token expiration time in seconds
   */
  constructor(config: AuthConfig) {
    this.jwtSecret = config.jwtSecret;
    this.tokenExpiry = config.tokenExpiry;
  }

  /**
   * Authenticates user with email and password
   * 
   * @param email - User's email address
   * @param password - User's password (will be hashed)
   * 
   * @returns JWT access token and refresh token
   * 
   * @throws {AuthenticationError} When credentials are invalid
   * @throws {AccountLocked} When account is locked after too many failed attempts
   * 
   * @example
   * ```typescript
   * try {
   *   const { accessToken, refreshToken } = await authService.login(
   *     'user@example.com',
   *     'SecurePass123!'
   *   );
   *   
   *   // Store tokens
   *   localStorage.setItem('accessToken', accessToken);
   *   localStorage.setItem('refreshToken', refreshToken);
   * } catch (error) {
   *   if (error instanceof AccountLocked) {
   *     console.error('Account locked. Try again in 15 minutes.');
   *   }
   * }
   * ```
   */
  async login(email: string, password: string): Promise<AuthTokens> {
    // Implementation
  }

  /**
   * Verifies JWT token and returns payload
   * 
   * @param token - JWT token to verify
   * @returns Decoded token payload
   * @throws {TokenExpired} When token has expired
   * @throws {InvalidToken} When token signature is invalid
   * 
   * @internal
   * This method is for internal use only
   */
  private verifyToken(token: string): TokenPayload {
    // Implementation
  }
}

/**
 * Authentication configuration options
 * 
 * @public
 */
export interface AuthConfig {
  /** JWT secret key (min 32 characters) */
  jwtSecret: string;
  
  /** Access token expiration in seconds (default: 900 = 15min) */
  tokenExpiry?: number;
  
  /** Enable refresh tokens (default: true) */
  enableRefreshTokens?: boolean;
  
  /** Refresh token expiration in seconds (default: 604800 = 7 days) */
  refreshTokenExpiry?: number;
}

/**
 * Represents authentication tokens
 */
export interface AuthTokens {
  /** Short-lived access token (15 minutes) */
  accessToken: string;
  
  /** Long-lived refresh token (7 days) */
  refreshToken: string;
  
  /** Token expiration timestamp (Unix time) */
  expiresAt: number;
}
```

#### Type Documentation

```typescript
/**
 * User object returned from API
 * 
 * @example
 * ```typescript
 * const user: User = {
 *   id: 'usr_123',
 *   email: 'user@example.com',
 *   name: 'John Doe',
 *   role: 'admin',
 *   createdAt: new Date(),
 *   updatedAt: new Date()
 * };
 * ```
 */
export interface User {
  /** Unique user identifier (prefixed with usr_) */
  id: string;
  
  /** User's email address (must be unique) */
  email: string;
  
  /** User's display name */
  name: string;
  
  /** User's role in the system */
  role: 'admin' | 'user' | 'moderator' | 'guest';
  
  /** Profile avatar URL (optional) */
  avatar?: string;
  
  /** User creation timestamp */
  createdAt: Date;
  
  /** Last update timestamp */
  updatedAt: Date;
  
  /** Account deletion timestamp (null if not deleted) */
  deletedAt?: Date | null;
}

/**
 * Enum for user roles with associated permissions
 * 
 * @remarks
 * Roles are hierarchical: admin > moderator > user > guest
 */
export enum UserRole {
  /** Full system access */
  ADMIN = 'admin',
  
  /** Can moderate content and users */
  MODERATOR = 'moderator',
  
  /** Standard user with basic permissions */
  USER = 'user',
  
  /** Read-only access */
  GUEST = 'guest'
}
```

#### React Component Documentation

```typescript
/**
 * Button component with multiple variants and sizes
 * 
 * @component
 * 
 * @example
 * ```tsx
 * // Primary button
 * <Button variant="primary" onClick={handleClick}>
 *   Click me
 * </Button>
 * 
 * // Loading state
 * <Button variant="secondary" isLoading>
 *   Processing...
 * </Button>
 * 
 * // With icon
 * <Button variant="outline" icon={<PlusIcon />}>
 *   Add Item
 * </Button>
 * ```
 */
export interface ButtonProps {
  /**
   * Button content (text, icons, or elements)
   */
  children: React.ReactNode;
  
  /**
   * Visual style variant
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  
  /**
   * Button size
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Show loading spinner and disable interaction
   * @default false
   */
  isLoading?: boolean;
  
  /**
   * Disable button interaction
   * @default false
   */
  disabled?: boolean;
  
  /**
   * Icon to display before button text
   */
  icon?: React.ReactNode;
  
  /**
   * Click event handler
   */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  
  /**
   * Button type attribute
   * @default 'button'
   */
  type?: 'button' | 'submit' | 'reset';
  
  /**
   * Full width button
   * @default false
   */
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon,
  onClick,
  type = 'button',
  fullWidth = false,
}) => {
  // Implementation
};
```

---

## 8.1. Tài liệu Phát triển

### 8.1.1. Project Documentation Structure

```
docs/
├── README.md                 # Project overview
├── GETTING_STARTED.md       # Setup guide
├── ARCHITECTURE.md          # System architecture
├── API_DOCUMENTATION.md     # API reference
├── DEPLOYMENT.md            # Deployment guide
├── CONTRIBUTING.md          # Contribution guidelines
├── CHANGELOG.md             # Version history
├── TROUBLESHOOTING.md       # Common issues
├── api/
│   ├── authentication.md
│   ├── users.md
│   ├── products.md
│   └── orders.md
├── guides/
│   ├── frontend-setup.md
│   ├── backend-setup.md
│   ├── database-setup.md
│   └── testing.md
└── examples/
    ├── authentication-flow.md
    ├── api-integration.md
    └── component-usage.md
```

### 8.1.2. API Documentation với OpenAPI/Swagger

#### Setup Swagger UI trong Next.js

```bash
# Install dependencies
npm install swagger-jsdoc swagger-ui-react
npm install -D @types/swagger-ui-react
```

```typescript
// lib/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Code Grader API Documentation',
      version: '1.0.0',
      description: 'Comprehensive REST API documentation for the Code Grader platform',
      contact: {
        name: 'API Support',
        email: 'api@codegrader.com',
        url: 'https://codegrader.com/support'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server'
      },
      {
        url: 'https://staging-api.codegrader.com',
        description: 'Staging server'
      },
      {
        url: 'https://api.codegrader.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer {token}'
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for service-to-service authentication'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          required: ['error', 'statusCode'],
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            statusCode: {
              type: 'integer',
              description: 'HTTP status code'
            },
            details: {
              type: 'object',
              description: 'Additional error details'
            }
          }
        },
        User: {
          type: 'object',
          required: ['id', 'email', 'name', 'role'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: 'usr_123abc'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com'
            },
            name: {
              type: 'string',
              example: 'John Doe'
            },
            role: {
              type: 'string',
              enum: ['admin', 'user', 'moderator', 'guest'],
              example: 'user'
            },
            avatar: {
              type: 'string',
              format: 'uri',
              nullable: true,
              example: 'https://cdn.example.com/avatars/user123.jpg'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-01T00:00:00Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-01T00:00:00Z'
            }
          }
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              example: 100
            },
            page: {
              type: 'integer',
              example: 1
            },
            limit: {
              type: 'integer',
              example: 10
            },
            totalPages: {
              type: 'integer',
              example: 10
            }
          }
        }
      },
      parameters: {
        PageParam: {
          name: 'page',
          in: 'query',
          description: 'Page number for pagination',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          }
        },
        LimitParam: {
          name: 'limit',
          in: 'query',
          description: 'Number of items per page',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10
          }
        },
        SortParam: {
          name: 'sort',
          in: 'query',
          description: 'Sort field and direction (e.g., createdAt:desc)',
          required: false,
          schema: {
            type: 'string',
            example: 'createdAt:desc'
          }
        }
      },
      responses: {
        Unauthorized: {
          description: 'Unauthorized - Invalid or missing authentication token',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Unauthorized',
                statusCode: 401,
                details: {
                  message: 'Please provide a valid authentication token'
                }
              }
            }
          }
        },
        Forbidden: {
          description: 'Forbidden - Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error - Invalid input data',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Validation Error',
                statusCode: 400,
                details: {
                  fields: {
                    email: 'Invalid email format',
                    password: 'Password must be at least 8 characters'
                  }
                }
              }
            }
          }
        },
        ServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'Users',
        description: 'User management endpoints'
      },
      {
        name: 'Problems',
        description: 'Coding problem management'
      },
      {
        name: 'Submissions',
        description: 'Code submission and grading'
      }
    ]
  },
  apis: ['./pages/api/**/*.ts', './pages/api/**/*.js']
};

export const swaggerSpec = swaggerJsdoc(options);
```

**Swagger UI Page:**

```typescript
// pages/api-docs.tsx
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import { swaggerSpec } from '@/lib/swagger';

export default function ApiDocs() {
  return (
    <div className="api-docs">
      <SwaggerUI spec={swaggerSpec} />
    </div>
  );
}
```

#### Complete API Endpoint Documentation Example

```typescript
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get list of users
 *     description: |
 *       Retrieve a paginated list of users with optional filtering and sorting.
 *       Requires authentication. Admin users can see all users, regular users
 *       can only see active users.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SortParam'
 *       - name: role
 *         in: query
 *         description: Filter by user role
 *         required: false
 *         schema:
 *           type: string
 *           enum: [admin, user, moderator, guest]
 *       - name: search
 *         in: query
 *         description: Search by name or email
 *         required: false
 *         schema:
 *           type: string
 *           example: john
 *     responses:
 *       200:
 *         description: Successful response with user list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *             example:
 *               users:
 *                 - id: usr_123
 *                   email: john@example.com
 *                   name: John Doe
 *                   role: user
 *                   createdAt: '2025-01-01T00:00:00Z'
 *                 - id: usr_456
 *                   email: jane@example.com
 *                   name: Jane Smith
 *                   role: admin
 *                   createdAt: '2025-01-02T00:00:00Z'
 *               meta:
 *                 total: 50
 *                 page: 1
 *                 limit: 10
 *                 totalPages: 5
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 *   post:
 *     summary: Create new user
 *     description: |
 *       Create a new user account. Only admin users can create other admin accounts.
 *       Email must be unique.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address (must be unique)
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: User's display name
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: User's password (min 8 chars, must include uppercase, lowercase, number, special char)
 *               role:
 *                 type: string
 *                 enum: [user, moderator, admin]
 *                 default: user
 *                 description: User's role in the system
 *           example:
 *             email: newuser@example.com
 *             name: New User
 *             password: SecurePass123!
 *             role: user
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a specific user by their unique identifier
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: User ID
 *         required: true
 *         schema:
 *           type: string
 *           example: usr_123
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   patch:
 *     summary: Update user
 *     description: |
 *       Update user information. Users can update their own profile.
 *       Admins can update any user.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 format: uri
 *           example:
 *             name: Updated Name
 *             avatar: https://cdn.example.com/avatar.jpg
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     summary: Delete user
 *     description: |
 *       Soft delete a user account. Users can delete their own account.
 *       Admins can delete any user. Data can be recovered within 30 days.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: User deleted successfully (no content)
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handler implementation
}
```

---

### 8.1.2. README Template

```markdown
# Project Name

Brief description of your project

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Features

- ✅ Feature 1
- ✅ Feature 2
- ✅ Feature 3
- 🚧 Feature 4 (In Progress)
- 📋 Feature 5 (Planned)

## Tech Stack

**Frontend:**
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS

**Backend:**
- Node.js
- Express
- PostgreSQL
- Redis

**DevOps:**
- Docker
- Vercel
- GitHub Actions

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL >= 14
- Redis >= 7.0

## Installation

\`\`\`bash
# Clone repository
git clone https://github.com/username/project.git
cd project

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local

# Run database migrations
npm run migrate

# Start development server
npm run dev
\`\`\`

## Configuration

### Environment Variables

\`\`\`env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Authentication
JWT_SECRET=your_jwt_secret
JWT_EXPIRY=15m

# API Keys
NEXT_PUBLIC_API_URL=http://localhost:3000/api
FIREBASE_API_KEY=your_firebase_key

# Redis
REDIS_URL=redis://localhost:6379
\`\`\`

## Usage

### Development

\`\`\`bash
npm run dev
\`\`\`

### Production Build

\`\`\`bash
npm run build
npm start
\`\`\`

### Testing

\`\`\`bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run e2e tests
npm run test:e2e
\`\`\`

## API Documentation

API documentation is available at `/api-docs` when running the server.

See [API Documentation](./docs/API_DOCUMENTATION.md) for detailed information.

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
```

### 8.1.3. API Documentation

#### Using Swagger/OpenAPI

```typescript
// lib/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
      description: 'Comprehensive API documentation',
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server',
      },
      {
        url: 'https://api.production.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./pages/api/**/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
```

#### API Endpoint Documentation Example

```typescript
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get list of users
 *     description: Retrieve a paginated list of users
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
export default async function handler(req, res) {
  // Handler implementation
}

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - id
 *         - email
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         email:
 *           type: string
 *           format: email
 *         name:
 *           type: string
 *         avatar:
 *           type: string
 *           format: uri
 *         createdAt:
 *           type: string
 *           format: date-time
 */
```

### 8.1.4. Code Documentation

#### TSDoc Comments

```typescript
/**
 * Authenticates a user with email and password
 * 
 * @param email - The user's email address
 * @param password - The user's password
 * @returns A promise that resolves to the authenticated user
 * @throws {AuthenticationError} When credentials are invalid
 * 
 * @example
 * ```typescript
 * const user = await authService.login('user@example.com', 'password123');
 * console.log(user.name);
 * ```
 */
async login(email: string, password: string): Promise<User> {
  // Implementation
}

/**
 * Configuration options for the authentication service
 * 
 * @interface
 */
interface AuthConfig {
  /** JWT secret key */
  secret: string;
  /** Token expiration time in seconds */
  expiresIn: number;
  /** Enable refresh tokens */
  refreshTokens?: boolean;
}

/**
 * Represents a user in the system
 * 
 * @class
 */
class User {
  /** Unique user identifier */
  id: string;
  
  /** User's email address */
  email: string;
  
  /** User's display name */
  name: string;
  
  /**
   * Creates a new user instance
   * 
   * @param data - User data object
   */
  constructor(data: UserData) {
    // Implementation
  }
}
```

### 8.1.3. Architecture Decision Records (ADRs)

**ADRs** document important architectural decisions để team hiểu tại sao chọn solution A thay vì solution B.

#### ADR Template

```markdown
# ADR-001: Use TypeScript for Frontend Development

## Status
Accepted

## Context
We need to choose a language for our frontend development. Options considered:
- JavaScript (ES6+)
- TypeScript
- Flow

Team concerns:
- Type safety to catch errors early
- Better IDE support (autocomplete, refactoring)
- Maintainability for large codebase
- Learning curve for team members

## Decision
We will use TypeScript for all frontend code.

## Consequences

### Positive:
- ✅ Compile-time type checking reduces runtime errors
- ✅ Excellent IDE support (VS Code intellisense)
- ✅ Easier refactoring with type safety
- ✅ Better documentation through types
- ✅ Growing ecosystem and community support

### Negative:
- ❌ Slight learning curve for team members (est. 1 week)
- ❌ Additional build step (compilation)
- ❌ More verbose code compared to JavaScript
- ❌ Need to manage type definitions for some libraries

### Neutral:
- 🔄 Compilation adds ~5 seconds to build time (acceptable)
- 🔄 Type definitions needed for untyped libraries (usually available on DefinitelyTyped)

## Implementation
- All new files will be `.ts` or `.tsx`
- Migrate existing JavaScript files gradually
- Use `strict` mode in `tsconfig.json`
- Set up ESLint with TypeScript rules
- Training session scheduled for team (Jan 15, 2025)

## Alternatives Considered

### JavaScript (ES6+)
- Pros: No learning curve, simpler syntax
- Cons: No type safety, harder to maintain

### Flow
- Pros: Type safety like TypeScript
- Cons: Smaller community, Facebook-specific, declining adoption

## References
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- Team discussion: https://github.com/company/repo/discussions/123

## Date
2025-01-05

## Supersedes
None

## Superseded by
None
```

#### More ADR Examples

```markdown
# ADR-002: Use PostgreSQL as Primary Database

## Status
Accepted

## Context
Need to choose database for user data, submissions, and grading results.

Requirements:
- ACID transactions
- JSON support for flexible schemas
- Full-text search
- Horizontal scalability
- Open-source

Options: PostgreSQL, MySQL, MongoDB, DynamoDB

## Decision
Use PostgreSQL 14+

## Rationale
- ✅ ACID compliant (critical for grading accuracy)
- ✅ JSONB support for flexible data
- ✅ Full-text search built-in
- ✅ Mature ecosystem
- ✅ Free and open-source
- ✅ Excellent performance for read-heavy workloads

---

# ADR-003: Use Server-Side Rendering (SSR) with Next.js

## Status
Accepted

## Context
SEO is critical for our documentation pages. Need to choose rendering strategy.

Options:
- Client-Side Rendering (CSR)
- Server-Side Rendering (SSR)
- Static Site Generation (SSG)
- Incremental Static Regeneration (ISR)

## Decision
Use SSR with Next.js for dynamic pages, SSG for static content

## Consequences
- ✅ Improved SEO (search engines index content immediately)
- ✅ Faster initial page load (HTML rendered on server)
- ❌ Increased server costs (each request requires server processing)
- ❌ More complex caching strategy

---

# ADR-004: Use Monorepo with pnpm Workspaces

## Status
Accepted

## Context
Need to share code between frontend, backend, and mobile app.

Options:
- Monorepo (all code in one repository)
- Multi-repo (separate repositories for each service)
- Micro-frontends

## Decision
Use monorepo with pnpm workspaces

Structure:
```
packages/
  ├── web/          (Next.js frontend)
  ├── api/          (Express backend)
  ├── shared/       (Shared types, utils)
  └── mobile/       (React Native)
```

## Consequences
- ✅ Easier code sharing
- ✅ Atomic commits across services
- ✅ Single CI/CD pipeline
- ❌ Larger repository size
- ❌ Need monorepo tooling (pnpm, Nx, Turborepo)
```

#### ADR Index

```markdown
# Architecture Decision Records

## Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [ADR-001](./adr-001-typescript.md) | Use TypeScript for Frontend | Accepted | 2025-01-05 |
| [ADR-002](./adr-002-postgresql.md) | Use PostgreSQL as Primary Database | Accepted | 2025-01-06 |
| [ADR-003](./adr-003-nextjs-ssr.md) | Use Server-Side Rendering with Next.js | Accepted | 2025-01-07 |
| [ADR-004](./adr-004-monorepo.md) | Use Monorepo with pnpm Workspaces | Accepted | 2025-01-10 |
| [ADR-005](./adr-005-jwt-auth.md) | Use JWT for Authentication | Accepted | 2025-01-12 |
| [ADR-006](./adr-006-docker.md) | Containerize with Docker | Accepted | 2025-01-15 |
| [ADR-007](./adr-007-redis-cache.md) | Use Redis for Caching | Accepted | 2025-01-18 |
| [ADR-008](./adr-008-github-actions.md) | Use GitHub Actions for CI/CD | Accepted | 2025-01-20 |

## Template

Use [ADR-000-template.md](./adr-000-template.md) when creating new ADRs.

## Process

1. Create new ADR file: `adr-NNN-title.md`
2. Fill in template
3. Discuss with team
4. Update status (Proposed → Accepted/Rejected)
5. Update this index
```

---

### 8.1.4. Component Documentation với Storybook

**Storybook** cho phép document và test UI components isolation.

#### Setup Storybook

```bash
# Initialize Storybook
npx storybook@latest init

# Run Storybook
npm run storybook
```

#### Component Story Example

```typescript
// components/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

/**
 * Button component với nhiều variants và sizes.
 * 
 * ## Usage
 * ```tsx
 * import { Button } from '@/components/Button';
 * 
 * <Button variant="primary" onClick={handleClick}>
 *   Click me
 * </Button>
 * ```
 * 
 * ## Accessibility
 * - Keyboard navigable (Tab, Enter, Space)
 * - Screen reader compatible
 * - ARIA labels supported
 */
const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger'],
      description: 'Visual style of the button'
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the button'
    },
    isLoading: {
      control: 'boolean',
      description: 'Show loading spinner'
    },
    disabled: {
      control: 'boolean',
      description: 'Disable button interaction'
    },
    fullWidth: {
      control: 'boolean',
      description: 'Make button full width'
    }
  }
};

export default meta;
type Story = StoryObj<typeof Button>;

/**
 * Primary button - default style for main actions
 */
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button'
  }
};

/**
 * Secondary button - for less prominent actions
 */
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button'
  }
};

/**
 * Outline button - for alternative actions
 */
export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Button'
  }
};

/**
 * Danger button - for destructive actions (delete, remove)
 */
export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Delete'
  }
};

/**
 * Loading state - shown during async operations
 */
export const Loading: Story = {
  args: {
    variant: 'primary',
    isLoading: true,
    children: 'Processing...'
  }
};

/**
 * Disabled state - when action cannot be performed
 */
export const Disabled: Story = {
  args: {
    variant: 'primary',
    disabled: true,
    children: 'Disabled Button'
  }
};

/**
 * With icon - button with leading icon
 */
export const WithIcon: Story = {
  args: {
    variant: 'primary',
    icon: <PlusIcon className="w-4 h-4" />,
    children: 'Add Item'
  }
};

/**
 * Full width - button spans entire container width
 */
export const FullWidth: Story = {
  args: {
    variant: 'primary',
    fullWidth: true,
    children: 'Full Width Button'
  }
};

/**
 * All sizes comparison
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex gap-4 items-center">
      <Button variant="primary" size="sm">Small</Button>
      <Button variant="primary" size="md">Medium</Button>
      <Button variant="primary" size="lg">Large</Button>
    </div>
  )
};

/**
 * All variants comparison
 */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
    </div>
  )
};
```

---

## 8.2. User Documentation - Tài liệu Người dùng

### 8.2.1. User Guide Template

```markdown
# User Guide: Submitting Code for Grading

## Overview
This guide explains how to submit your code for automated grading.

## Prerequisites
- Active account on Code Grader
- Access to a problem (assigned by instructor)
- Code solution ready in supported language

## Supported Languages
- ✅ Python 3.8+
- ✅ JavaScript/TypeScript (Node.js)
- ✅ Java 11+
- ✅ C++ 17+
- ✅ Go 1.20+

## Step-by-Step Guide

### Step 1: Navigate to Problem
1. Log in to your account
2. Go to **My Problems** from dashboard
3. Click on the problem you want to solve

### Step 2: Read Problem Description
- Carefully read problem statement
- Note input/output format
- Check constraints and examples
- Review test cases (if visible)

### Step 3: Write Solution
You have two options:

#### Option A: Use Online Editor
1. Click **Code Editor** tab
2. Select your programming language
3. Write/paste your code
4. Use **Run** button to test locally

#### Option B: Upload File
1. Click **Upload** tab
2. Choose your code file
3. Verify correct language detected
4. Click **Upload Code**

### Step 4: Submit for Grading
1. Click **Submit** button
2. Confirm submission (cannot undo)
3. Wait for grading (usually < 30 seconds)

### Step 5: Review Results
After grading, you'll see:
- ✅ **Test cases passed**: Your code passed these tests
- ❌ **Test cases failed**: Your code failed these tests
- ⏱️ **Execution time**: How long your code took
- 💾 **Memory used**: Peak memory consumption
- 📊 **Score**: Percentage of tests passed

### Example: Python Solution

**Problem**: Sum of two numbers

**Input**: Two integers on one line  
**Output**: Sum of the two numbers

**Solution**:
```python
# Read input
a, b = map(int, input().split())

# Calculate sum
result = a + b

# Output result
print(result)
```

**Test Case**:
- Input: `5 3`
- Expected Output: `8`

## Common Issues

### Issue: "Compilation Error"
**Cause**: Your code has syntax errors  
**Solution**: Check for typos, missing brackets, incorrect indentation

### Issue: "Runtime Error"
**Cause**: Your code crashes during execution  
**Solution**: Check for division by zero, array out of bounds, null pointers

### Issue: "Time Limit Exceeded"
**Cause**: Your code is too slow  
**Solution**: Optimize algorithm, reduce complexity

### Issue: "Wrong Answer"
**Cause**: Output doesn't match expected  
**Solution**: Carefully read problem, check edge cases

## Tips for Success
- 📝 Read problem carefully
- 🧪 Test with example cases first
- 🐛 Handle edge cases (empty input, large numbers)
- ⏱️ Optimize for time/space complexity
- 💬 Ask instructor if unclear

## Need Help?
- 📧 Email: support@codegrader.com
- 💬 Chat: Available 9 AM - 5 PM
- 📖 FAQ: [link]
```

---

### 8.1.5. Architecture Documentation

```markdown
# System Architecture

## Overview

This document describes the high-level architecture of the application.

## Architecture Diagram

```
┌─────────────────┐
│   Frontend      │
│   (Next.js)     │
└────────┬────────┘
         │
         │ HTTPS
         │
┌────────▼────────┐
│   API Gateway   │
│   (Express)     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼───┐
│Auth  │  │ Core │
│Service│  │Service│
└───┬──┘  └──┬───┘
    │        │
    │   ┌────▼────┐
    │   │Database │
    │   │(PostgreSQL)│
    │   └─────────┘
    │
┌───▼──────┐
│  Redis   │
│  Cache   │
└──────────┘
```

## Components

### Frontend Layer

- **Technology**: Next.js 14, React 18, TypeScript
- **Responsibilities**:
  - User interface rendering
  - Client-side state management
  - API communication
  - Routing and navigation

### API Layer

- **Technology**: Express.js, Node.js
- **Responsibilities**:
  - Request validation
  - Authentication/Authorization
  - Business logic
  - Data transformation

### Service Layer

- **Authentication Service**: User authentication and token management
- **User Service**: User profile management
- **Product Service**: Product catalog management
- **Order Service**: Order processing

### Data Layer

- **PostgreSQL**: Primary data store
- **Redis**: Caching and session management
- **Firebase Storage**: File storage

## Data Flow

1. User initiates action in frontend
2. Frontend sends API request with JWT token
3. API Gateway validates token
4. Request routed to appropriate service
5. Service performs business logic
6. Service queries database
7. Response cached in Redis
8. Response sent back to frontend
9. Frontend updates UI

## Security Considerations

- All communication over HTTPS
- JWT-based authentication
- Role-based access control
- Input validation at all layers
- SQL injection prevention
- XSS protection

## Scalability

- Horizontal scaling of API servers
- Database read replicas
- Redis cluster for distributed caching
- CDN for static assets
```

## 8.2. Đào tạo và Hỗ trợ

### 8.2.1. Onboarding Documentation

```markdown
# Developer Onboarding Guide

Welcome to the team! This guide will help you get up to speed.

## Week 1: Environment Setup

### Day 1-2: Setup Development Environment

- [ ] Request access to GitHub repository
- [ ] Request access to development database
- [ ] Install required software
  - [ ] Node.js 18+
  - [ ] VS Code
  - [ ] Git
  - [ ] Docker
- [ ] Clone repository
- [ ] Setup environment variables
- [ ] Run application locally
- [ ] Complete "Hello World" task

### Day 3-4: Understand Architecture

- [ ] Read architecture documentation
- [ ] Review codebase structure
- [ ] Understand data models
- [ ] Review API documentation
- [ ] Run tests locally

### Day 5: First Contribution

- [ ] Pick a "good first issue"
- [ ] Create feature branch
- [ ] Implement changes
- [ ] Write tests
- [ ] Submit pull request
- [ ] Code review process

## Week 2: Feature Development

### Tasks

1. Implement user profile feature
2. Write unit tests
3. Write integration tests
4. Update documentation

### Learning Resources

- [Internal Wiki](https://wiki.company.com)
- [API Documentation](./API_DOCUMENTATION.md)
- [Code Style Guide](./CODE_STYLE.md)
- [Testing Guide](./TESTING.md)

## Mentorship

Your mentor: [Mentor Name]
- Weekly 1:1 meetings
- Code review feedback
- Technical guidance

## Communication Channels

- Slack: #engineering
- Daily standups: 9:00 AM
- Weekly team meetings: Friday 2:00 PM

## Questions?

Don't hesitate to ask! We're here to help.
```

### 8.2.2. Video Tutorials

```markdown
# Video Tutorial Series

## Getting Started

1. **Environment Setup** (10 min)
   - Installing dependencies
   - Configuring environment
   - Running the application

2. **Project Structure** (15 min)
   - Directory organization
   - File naming conventions
   - Module responsibilities

3. **Development Workflow** (20 min)
   - Git workflow
   - Creating branches
   - Pull request process
   - Code review

## Feature Development

4. **Building Components** (25 min)
   - Component architecture
   - Props and state
   - Styling with Tailwind

5. **API Integration** (30 min)
   - Making API calls
   - Error handling
   - Loading states

6. **State Management** (25 min)
   - Redux Toolkit basics
   - Creating slices
   - Async actions

## Testing

7. **Unit Testing** (20 min)
   - Jest basics
   - Testing components
   - Testing hooks

8. **E2E Testing** (25 min)
   - Playwright setup
   - Writing test scenarios
   - Best practices

## Deployment

9. **Deployment Process** (15 min)
   - Building for production
   - Environment variables
   - Deploying to Vercel

10. **Monitoring** (20 min)
    - Setting up Sentry
    - Monitoring metrics
    - Debugging issues
```

### 8.2.3. Interactive Learning

#### Code Playground

```typescript
// Create an interactive code playground
// pages/playground.tsx

import { useState } from 'react';
import Editor from '@monaco-editor/react';

export default function Playground() {
  const [code, setCode] = useState(`
// Try our API
const response = await fetch('/api/users', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});

const data = await response.json();
console.log(data);
  `);

  const [output, setOutput] = useState('');

  const runCode = async () => {
    try {
      // Safely execute code
      const result = await eval(code);
      setOutput(JSON.stringify(result, null, 2));
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
  };

  return (
    <div className="playground">
      <h1>API Playground</h1>
      
      <Editor
        height="400px"
        language="javascript"
        value={code}
        onChange={(value) => setCode(value || '')}
        theme="vs-dark"
      />
      
      <button onClick={runCode}>Run Code</button>
      
      <div className="output">
        <h3>Output:</h3>
        <pre>{output}</pre>
      </div>
    </div>
  );
}
```

### 8.2.4. FAQ và Troubleshooting

```markdown
# Frequently Asked Questions

## Installation Issues

### Q: npm install fails with permission errors

**A:** Try the following:
```bash
# Clear npm cache
npm cache clean --force

# Use sudo (Linux/Mac)
sudo npm install

# Or fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

### Q: Port 3000 is already in use

**A:** Kill the process using port 3000:
```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

## Development Issues

### Q: Changes not reflecting in browser

**A:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Restart development server
4. Check if file is saved
5. Check for TypeScript errors

### Q: Database connection failed

**A:**
1. Check if PostgreSQL is running:
   ```bash
   sudo service postgresql status
   ```
2. Verify connection string in `.env`
3. Check database exists:
   ```bash
   psql -U postgres -l
   ```
4. Check user permissions

## Testing Issues

### Q: Tests failing locally but pass in CI

**A:**
1. Clear jest cache: `npm test -- --clearCache`
2. Check for timezone issues
3. Check for environment-specific code
4. Verify test data setup

### Q: E2E tests timing out

**A:**
1. Increase timeout in config
2. Check if app is running
3. Check network connectivity
4. Add wait conditions
```

### 8.2.5. Support Resources

```markdown
# Getting Help

## Documentation

1. **Project Wiki**: [wiki.company.com](https://wiki.company.com)
2. **API Docs**: [api-docs.company.com](https://api-docs.company.com)
3. **Video Tutorials**: [learning.company.com](https://learning.company.com)

## Communication Channels

### Slack Channels

- `#engineering`: General engineering discussions
- `#frontend`: Frontend-specific questions
- `#backend`: Backend-specific questions
- `#devops`: Infrastructure and deployment
- `#help`: General help and support

### Office Hours

- **Monday**: Backend office hours (2-3 PM)
- **Wednesday**: Frontend office hours (2-3 PM)
- **Friday**: Architecture discussions (3-4 PM)

## Bug Reports

When reporting bugs, please include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots/logs
- Environment details

Use this template:
```markdown
## Bug Description
[Clear description of the bug]

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
[What you expected to happen]

## Actual Behavior
[What actually happened]

## Screenshots
[If applicable]

## Environment
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 120]
- Version: [e.g., 1.2.3]
```

## Feature Requests

Submit feature requests through:
- GitHub Issues with `feature-request` label
- Slack channel `#feature-requests`
- Monthly planning meetings
```

## 8.3. Documentation Best Practices

### 8.3.1. Writing Guidelines

- Use clear, concise language
- Include code examples
- Add diagrams where helpful
- Keep documentation up-to-date
- Version documentation with code
- Make it searchable

### 8.3.2. Documentation Maintenance

- Review quarterly
- Update with each release
- Track documentation issues
- Solicit feedback from users
- Measure documentation usage

### 8.3.3. Accessibility

- Use semantic HTML
- Provide alt text for images
- Ensure good contrast
- Support screen readers
- Make documentation searchable

## 8.4. Kết luận

Tài liệu và đào tạo tốt là chìa khóa để team có thể collaborate hiệu quả và maintain code quality. Đầu tư vào documentation sẽ giảm onboarding time và tăng productivity của team.

---

**Ngày cập nhật**: 05/11/2025  
**Phiên bản**: 1.0
