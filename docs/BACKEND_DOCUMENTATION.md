# 📘 Báo Cáo Tài Liệu Backend - Code Grader Project

## 📋 Mục Lục

1. [Giới Thiệu](#1-giới-thiệu)
2. [Kiến Trúc Tổng Quan](#2-kiến-trúc-tổng-quan)
3. [Cơ Chế Hoạt Động](#3-cơ-chế-hoạt-động)
4. [Các File Core và Chức Năng](#4-các-file-core-và-chức-năng)
5. [Database Models](#5-database-models)
6. [API Routes](#6-api-routes)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Message Queue System](#8-message-queue-system)
9. [Cấu Hình và Deployment](#9-cấu-hình-và-deployment)
10. [Best Practices & Patterns](#10-best-practices--patterns)

---

## 1. Giới Thiệu

### 1.1 Tổng Quan
Backend của **Code Grader Project** là một RESTful API được xây dựng trên Flask framework (Python), đóng vai trò là trung tâm xử lý logic nghiệp vụ và quản lý dữ liệu cho hệ thống chấm bài lập trình tự động.

### 1.2 Công Nghệ Sử Dụng
- **Framework**: Flask 3.1.2
- **Database**: PostgreSQL (via SQLAlchemy ORM)
- **Authentication**: JWT (Flask-JWT-Extended)
- **Message Queue**: RabbitMQ (via Pika)
- **Migration**: Alembic (Flask-Migrate)
- **API Documentation**: Swagger UI
- **Security**: Werkzeug password hashing

### 1.3 Vai Trò Trong Hệ Thống
```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Frontend  │ ←────→  │   Backend    │ ←────→  │  PostgreSQL │
│  (Next.js)  │   HTTP  │   (Flask)    │   ORM   │  Database   │
└─────────────┘         └──────────────┘         └─────────────┘
                              │
                              │ RabbitMQ
                              ↓
                        ┌──────────────┐
                        │    Worker    │
                        │   (Grader)   │
                        └──────────────┘
```

---

## 2. Kiến Trúc Tổng Quan

### 2.1 Cấu Trúc Thư Mục

```
backend/
├── app/
│   ├── __init__.py              # Application factory
│   ├── config.py                # Configuration settings
│   ├── models.py                # Database models
│   ├── decorators.py            # Custom decorators
│   ├── rabbitmq_producer.py     # Message queue producer
│   ├── cleanup_service.py       # Cleanup old data
│   ├── commands.py              # CLI commands
│   ├── routes/                  # API endpoints
│   │   ├── __init__.py
│   │   ├── auth_routes.py       # Authentication
│   │   ├── class_routes.py      # Class management
│   │   ├── problem_routes.py    # Problem CRUD
│   │   ├── submission_routes.py # Submission handling
│   │   ├── student_routes.py    # Student-specific
│   │   ├── internal_routes.py   # Worker callbacks
│   │   └── health_routes.py     # Health check
│   └── static/
│       └── swagger.json         # API documentation
├── migrations/                  # Database migrations
│   ├── versions/
│   └── alembic.ini
├── Dockerfile
├── requirements.txt
└── run.py                       # Entry point
```

### 2.2 Design Patterns

#### Application Factory Pattern
```python
# app/__init__.py
def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(class_bp)
    # ...
    
    return app
```

**Lợi ích:**
- Dễ dàng test với nhiều configuration khác nhau
- Tách biệt concerns
- Hỗ trợ multiple instances

#### Blueprint Pattern
- **Modular routing**: Mỗi domain có blueprint riêng
- **URL prefixing**: `/api/auth`, `/api/classes`, etc.
- **Maintainability**: Dễ mở rộng và maintain

---

## 3. Cơ Chế Hoạt Động

### 3.1 Luồng Xử Lý Request Chung

```
┌──────────┐
│ Client   │
└────┬─────┘
     │ HTTP Request
     ↓
┌────────────────────────────┐
│  Flask Application         │
│  ┌──────────────────────┐  │
│  │ 1. CORS Middleware   │  │
│  └──────────────────────┘  │
│  ┌──────────────────────┐  │
│  │ 2. JWT Verification  │  │
│  │    (@jwt_required)   │  │
│  └──────────────────────┘  │
│  ┌──────────────────────┐  │
│  │ 3. Role Check        │  │
│  │    (@role_required)  │  │
│  └──────────────────────┘  │
│  ┌──────────────────────┐  │
│  │ 4. Route Handler     │  │
│  │    (Business Logic)  │  │
│  └──────────────────────┘  │
│  ┌──────────────────────┐  │
│  │ 5. Database Query    │  │
│  │    (SQLAlchemy ORM)  │  │
│  └──────────────────────┘  │
└────────────────────────────┘
     │ JSON Response
     ↓
┌──────────┐
│ Client   │
└──────────┘
```

### 3.2 Luồng Chấm Bài (Submission Flow)

```
┌────────────────────────────────────────────────────────────┐
│                   SUBMISSION WORKFLOW                       │
└────────────────────────────────────────────────────────────┘

1. STUDENT SUBMITS CODE
   ↓
   POST /api/submissions
   {
     "problem_id": 1,
     "source_code": "...",
     "language": "cpp"
   }

2. BACKEND PROCESSING
   ↓
   ┌─────────────────────────┐
   │ Validation              │
   │ - Check problem exists  │
   │ - Check student access  │
   │ - Validate code         │
   └─────────────────────────┘
   ↓
   ┌─────────────────────────┐
   │ Create Submission       │
   │ - Status: "Pending"     │
   │ - Save to database      │
   └─────────────────────────┘
   ↓
   ┌─────────────────────────┐
   │ Publish to RabbitMQ     │
   │ Queue: grading_queue    │
   │ Message: submission_id  │
   └─────────────────────────┘
   ↓
   Return 202 Accepted
   { "submission_id": 123, "status": "Pending" }

3. WORKER PROCESSING (Async)
   ↓
   Worker consumes message
   Grades submission
   ↓
   POST /api/internal/submissions/{id}/results
   {
     "status": "Completed",
     "results": [...]
   }

4. BACKEND UPDATES
   ↓
   Update submission status
   Store test results
   Calculate score

5. STUDENT POLLS RESULT
   ↓
   GET /api/submissions/{id}
   Returns complete results
```

### 3.3 Authentication Flow

```
┌────────────────────────────────────────────────────────────┐
│                   AUTHENTICATION FLOW                       │
└────────────────────────────────────────────────────────────┘

REGISTRATION:
POST /api/auth/register
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "secure123",
  "role": "student"
}
   ↓
1. Validate input
2. Check email uniqueness
3. Hash password (Werkzeug)
4. Create user in database
5. Return success

LOGIN:
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "secure123"
}
   ↓
1. Find user by email
2. Verify password
3. Generate JWT token (1 hour expiry)
4. Return access_token

PROTECTED ENDPOINT:
GET /api/auth/profile
Headers: Authorization: Bearer <token>
   ↓
1. Extract JWT from header
2. Verify token signature
3. Check expiration
4. Extract user_id from token
5. Fetch user data
6. Return profile
```

---

## 4. Các File Core và Chức Năng

### 4.1 `app/__init__.py` - Application Factory

**Mục đích:** Khởi tạo và cấu hình Flask application

**Chức năng chính:**
```python
def create_app():
    # 1. Tạo Flask app instance
    app = Flask(__name__)
    
    # 2. Load configuration
    app.config.from_object(Config)
    
    # 3. Initialize extensions
    compress.init_app(app)      # Response compression
    CORS(app)                    # Cross-Origin Resource Sharing
    db.init_app(app)             # Database ORM
    migrate.init_app(app, db)    # Database migrations
    jwt.init_app(app)            # JWT authentication
    
    # 4. Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(class_bp)
    app.register_blueprint(problem_bp)
    app.register_blueprint(submission_bp)
    app.register_blueprint(internal_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(health_bp)
    
    # 5. Setup Swagger UI
    swaggerui_blueprint = get_swaggerui_blueprint(...)
    app.register_blueprint(swaggerui_blueprint)
    
    # 6. Register CLI commands
    commands.init_app(app)
    
    return app
```

**Extensions được sử dụng:**
- `Flask-SQLAlchemy`: ORM cho database
- `Flask-Migrate`: Database migrations
- `Flask-JWT-Extended`: JWT authentication
- `Flask-CORS`: CORS handling
- `Flask-Compress`: Response compression
- `Flask-Swagger-UI`: API documentation

### 4.2 `app/config.py` - Configuration Management

**Mục đích:** Quản lý cấu hình ứng dụng

```python
class Config:
    # Security
    SECRET_KEY = os.environ.get('SECRET_KEY')
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
```

**Best Practices:**
- ✅ Sử dụng environment variables (12-factor app)
- ✅ Không hardcode secrets
- ✅ Load từ `.env` file (python-dotenv)

### 4.3 `app/models.py` - Database Models

**Mục đích:** Định nghĩa schema và relationships

**Models chính:**

#### 1. User Model
```python
class User(Base):
    id = Column(Integer, primary_key=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey('roles.id'))
    
    # Relationships
    role = relationship('Role')
    classes_taught = relationship('Class')
    submissions = relationship('Submission')
    classes_joined = relationship('Class', secondary=class_members)
```

**Tính năng:**
- Password hashing với Werkzeug
- Role-based access control
- Many-to-many relationship với Class

#### 2. Class Model
```python
class Class(Base):
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    course_code = Column(String(50))
    description = Column(Text)
    invite_code = Column(String(8), unique=True)
    teacher_id = Column(Integer, ForeignKey('users.id'))
    
    teacher = relationship('User')
    problems = relationship('Problem', cascade="all, delete-orphan")
    students = relationship('User', secondary=class_members)
```

**Features:**
- Automatic invite code generation (UUID)
- Cascade delete for problems
- Many-to-many với students

#### 3. Problem Model
```python
class Problem(Base):
    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    difficulty = Column(String(20), default='medium')
    grading_mode = Column(String(20), default='stdio')
    function_signature = Column(Text)
    time_limit_ms = Column(Integer, default=1000)
    memory_limit_kb = Column(Integer, default=256000)
    
    test_cases = relationship('TestCase', cascade="all, delete-orphan")
    submissions = relationship('Submission', cascade="all, delete-orphan")
```

**Grading Modes:**
- `stdio`: Standard input/output matching
- `function`: Function-level grading

#### 4. Submission Model
```python
class Submission(Base):
    id = Column(Integer, primary_key=True)
    problem_id = Column(Integer, ForeignKey('problems.id'))
    student_id = Column(Integer, ForeignKey('users.id'))
    source_code = Column(Text, nullable=False)
    language = Column(String(50), default='cpp')
    status = Column(String(50), default='Pending')
    is_test = Column(Boolean, default=False)
    cached_score = Column(Integer, default=0)
    
    results = relationship('SubmissionResult', cascade="all, delete-orphan")
```

**Status values:**
- `Pending`: Waiting in queue
- `Running`: Being graded
- `Completed`: Grading finished
- `Error`: Compilation/runtime error

### 4.4 `app/decorators.py` - Custom Decorators

**Mục đích:** Tạo decorators tái sử dụng cho authorization

```python
def role_required(role_name):
    """
    Decorator yêu cầu role cụ thể để truy cập endpoint
    Usage: @role_required('teacher')
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            
            if not user or user.role.name != role_name:
                return jsonify({"msg": f"'{role_name}' role required"}), 403
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator
```

**Cách sử dụng:**
```python
@class_bp.route('', methods=['POST'])
@jwt_required()
@role_required('teacher')  # Chỉ teacher mới tạo được class
def create_class():
    # ...
```

### 4.5 `app/rabbitmq_producer.py` - Message Queue

**Mục đích:** Gửi grading tasks đến worker

```python
def publish_task(task_data):
    """
    Gửi task chấm điểm vào queue
    
    Args:
        task_data: dict với submission_id
    """
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(host=RABBITMQ_HOST)
    )
    channel = connection.channel()
    
    # Khai báo queue (durable = persistent)
    channel.queue_declare(queue='grading_queue', durable=True)
    
    # Publish message
    channel.basic_publish(
        exchange='',
        routing_key='grading_queue',
        body=json.dumps(task_data),
        properties=pika.BasicProperties(
            delivery_mode=2,  # Persistent message
        )
    )
    
    connection.close()
```

**Tính năng:**
- Durable queue (survive broker restart)
- Persistent messages
- Error handling cho connection failures

### 4.6 `app/cleanup_service.py` - Data Cleanup

**Mục đích:** Tự động xóa test submissions cũ

```python
def cleanup_old_test_submissions(hours=1):
    """
    Xóa test submissions cũ hơn X giờ
    Test submissions (is_test=True) chỉ để test code,
    không cần lưu lâu dài
    """
    cutoff_time = datetime.utcnow() - timedelta(hours=hours)
    
    old_test_submissions = Submission.query.filter(
        Submission.is_test == True,
        Submission.submitted_at < cutoff_time
    ).all()
    
    for submission in old_test_submissions:
        db.session.delete(submission)
    
    db.session.commit()
```

**Use case:**
- Student test code nhiều lần trước khi submit
- Test submissions không cần lưu vĩnh viễn
- Giảm database size

---

## 5. Database Models

### 5.1 Entity Relationship Diagram

```
┌─────────────┐
│    Role     │
│─────────────│
│ id          │◄────┐
│ name        │     │
└─────────────┘     │
                    │ role_id
┌─────────────┐     │
│    User     │─────┘
│─────────────│
│ id          │◄────┬─────────────┐
│ full_name   │     │ teacher_id  │ student_id
│ email       │     │             │
│ password    │     │             │
│ role_id     │     │             │
└─────────────┘     │             │
       │            │             │
       │ M:N        │             │
       │            │             │
┌──────▼──────┐     │             │
│class_members│     │             │
│─────────────│     │             │
│student_id   │     │             │
│class_id     │     │             │
└──────┬──────┘     │             │
       │            │             │
       │            │             │
┌──────▼──────┐     │             │
│   Class     │─────┘             │
│─────────────│                   │
│ id          │◄───┐              │
│ name        │    │ class_id     │
│ invite_code │    │              │
│ teacher_id  │    │              │
└─────────────┘    │              │
                   │              │
┌─────────────┐    │              │
│  Problem    │────┘              │
│─────────────│                   │
│ id          │◄───┬────┐         │
│ title       │    │    │         │
│ class_id    │    │    │         │
│ difficulty  │    │    │         │
│ grading_mode│    │    │         │
└─────────────┘    │    │         │
       │           │    │         │
       │           │    │         │
┌──────▼──────┐    │    │         │
│  TestCase   │────┘    │         │
│─────────────│         │         │
│ id          │◄────┐   │         │
│ problem_id  │     │   │         │
│ input_data  │     │   │         │
│ expected    │     │   │         │
│ is_hidden   │     │   │         │
│ points      │     │   │         │
└─────────────┘     │   │         │
                    │   │         │
┌─────────────┐     │   │         │
│ Submission  │─────┘   │         │
│─────────────│         │         │
│ id          │◄────────┘         │
│ problem_id  │                   │
│ student_id  │───────────────────┘
│ source_code │
│ language    │
│ status      │
│ is_test     │
│ cached_score│
└─────────────┘
       │
       │
┌──────▼──────────┐
│SubmissionResult │
│─────────────────│
│ id              │
│ submission_id   │
│ test_case_id    │
│ status          │
│ execution_time  │
│ memory_used     │
│ output_received │
│ error_message   │
└─────────────────┘
```

### 5.2 Key Relationships

1. **User ↔ Role** (Many-to-One)
   - Mỗi user có 1 role (student/teacher)

2. **User ↔ Class** (Many-to-Many)
   - Students join nhiều classes
   - Through table: `class_members`

3. **Class ↔ User** (Many-to-One)
   - Mỗi class có 1 teacher

4. **Problem ↔ Class** (Many-to-One)
   - Mỗi problem thuộc 1 class
   - Cascade delete: Xóa class → xóa problems

5. **TestCase ↔ Problem** (Many-to-One)
   - Mỗi problem có nhiều test cases
   - Cascade delete: Xóa problem → xóa test cases

6. **Submission ↔ Problem/User** (Many-to-One)
   - Student nộp nhiều submissions cho 1 problem
   - Cascade delete: Xóa problem → xóa submissions

7. **SubmissionResult ↔ Submission/TestCase** (Many-to-One)
   - Mỗi submission có nhiều results (1 result/test case)
   - Cascade delete: Xóa submission → xóa results

### 5.3 Indexing Strategy

```python
# Indexed columns for performance
problem_id = Column(Integer, ForeignKey('problems.id'), index=True)
student_id = Column(Integer, ForeignKey('users.id'), index=True)
```

**Lý do:**
- Queries thường filter theo `student_id` và `problem_id`
- Cải thiện performance cho JOIN operations
- Critical cho leaderboard và progress tracking

---

## 6. API Routes

### 6.1 Authentication Routes (`/api/auth`)

#### POST `/api/auth/register`
**Mục đích:** Đăng ký tài khoản mới

**Request:**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "secure123",
  "role": "student"
}
```

**Response:** `201 Created`
```json
{
  "message": "User registered successfully"
}
```

**Validation:**
- Email phải unique
- Role phải valid (student/teacher)
- All fields required

#### POST `/api/auth/login`
**Mục đích:** Đăng nhập và nhận JWT token

**Request:**
```json
{
  "email": "john@example.com",
  "password": "secure123"
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Token expiry:** 1 hour

#### GET `/api/auth/profile`
**Authorization:** `Bearer token`  
**Mục đích:** Lấy thông tin profile của user hiện tại

**Response:** `200 OK`
```json
{
  "id": 1,
  "full_name": "John Doe",
  "email": "john@example.com",
  "role": "student"
}
```

### 6.2 Class Routes (`/api/classes`)

#### POST `/api/classes`
**Authorization:** `Bearer token` + `teacher role`  
**Mục đích:** Tạo lớp học mới

**Request:**
```json
{
  "name": "Data Structures 2024",
  "course_code": "CS201",
  "description": "Advanced data structures course"
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "name": "Data Structures 2024",
  "course_code": "CS201",
  "description": "Advanced data structures course",
  "invite_code": "a1b2c3d4"
}
```

#### GET `/api/classes`
**Authorization:** `Bearer token`  
**Mục đích:** Lấy danh sách classes

**Teacher response:**
```json
[
  {
    "id": 1,
    "name": "Data Structures 2024",
    "code": "CS201",
    "course_code": "CS201",
    "description": "...",
    "teacher_name": "Prof. Smith",
    "student_count": 25
  }
]
```

**Student response:**
```json
[
  {
    "id": 1,
    "name": "Data Structures 2024",
    "code": "CS201",
    "teacher_name": "Prof. Smith",
    "student_count": 25,
    "problems_done": 5,
    "problems_todo": 3,
    "total_problems": 8
  }
]
```

#### POST `/api/classes/join`
**Authorization:** `Bearer token` + `student role`  
**Mục đích:** Student tham gia class bằng invite code

**Request:**
```json
{
  "invite_code": "a1b2c3d4"
}
```

**Response:** `200 OK`
```json
{
  "message": "Successfully joined class",
  "class_id": 1,
  "class_name": "Data Structures 2024"
}
```

### 6.3 Problem Routes

#### POST `/api/classes/{class_id}/problems`
**Authorization:** `Bearer token` + `teacher role`  
**Mục đích:** Tạo bài tập trong class

**Request:**
```json
{
  "title": "Two Sum",
  "description": "Find two numbers that add up to target",
  "difficulty": "easy",
  "grading_mode": "stdio",
  "time_limit_ms": 1000,
  "memory_limit_kb": 256000,
  "test_cases": [
    {
      "input": "2 7 11 15\n9",
      "output": "0 1",
      "is_hidden": false,
      "points": 50
    },
    {
      "input": "3 2 4\n6",
      "output": "1 2",
      "is_hidden": true,
      "points": 50
    }
  ]
}
```

**Validation:**
- Total points ≤ 100
- At least 1 test case
- Points ≥ 0

#### GET `/api/classes/{class_id}/problems`
**Authorization:** `Bearer token`  
**Mục đích:** Lấy danh sách problems trong class

**Student response:** (ẩn hidden test cases)
```json
[
  {
    "id": 1,
    "title": "Two Sum",
    "difficulty": "easy",
    "test_cases": [
      {
        "id": 1,
        "input": "2 7 11 15\n9",
        "output": "0 1",
        "points": 50
      }
    ],
    "best_submission": {
      "score": 100,
      "status": "Completed"
    }
  }
]
```

### 6.4 Submission Routes (`/api/submissions`)

#### POST `/api/submissions`
**Authorization:** `Bearer token` + `student role`  
**Mục đích:** Nộp bài làm

**Request:**
```json
{
  "problem_id": 1,
  "source_code": "#include <iostream>\nint main() {...}",
  "language": "cpp"
}
```

**Response:** `202 Accepted`
```json
{
  "id": 123,
  "submission_id": 123,
  "status": "Pending"
}
```

**Flow:**
1. Validate student access
2. Create submission (status = Pending)
3. Publish to RabbitMQ
4. Return immediately (async)

#### GET `/api/submissions/{id}`
**Authorization:** `Bearer token`  
**Mục đích:** Lấy kết quả chấm bài

**Response:** `200 OK`
```json
{
  "id": 123,
  "problem_id": 1,
  "status": "Completed",
  "score": 100,
  "passed_tests": 2,
  "total_tests": 2,
  "submitted_at": "2024-01-15T10:30:00Z",
  "results": [
    {
      "test_case_id": 1,
      "status": "Passed",
      "execution_time_ms": 45,
      "memory_used_kb": 2048,
      "output_received": "0 1",
      "error_message": null,
      "expected_output": "0 1",
      "input_data": "2 7 11 15\n9",
      "points": 50,
      "earned_points": 50
    }
  ]
}
```

### 6.5 Internal Routes (`/api/internal`)

**Mục đích:** Callbacks từ worker (không cần JWT)

#### POST `/api/internal/submissions/{id}/results`
**Mục đích:** Worker update kết quả chấm bài

**Request:**
```json
{
  "status": "Completed",
  "results": [
    {
      "test_case_id": 1,
      "status": "Passed",
      "execution_time_ms": 45,
      "memory_used_kb": 2048,
      "output_received": "0 1",
      "error_message": null
    }
  ]
}
```

---

## 7. Authentication & Authorization

### 7.1 JWT Implementation

**Token Structure:**
```
eyJ0eXAiOiJKV1QiLCJhbGc.eyJmcmVzaCI6ZmFsc2UsImlhdCI.SflKxwRJSMeKKF2QT4fwpM
├─ Header (algorithm)
├─ Payload (user_id, expiry)
└─ Signature (SECRET_KEY)
```

**Configuration:**
```python
JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
SECRET_KEY = os.environ.get('SECRET_KEY')
```

**Generate token:**
```python
access_token = create_access_token(identity=str(user.id))
```

**Verify token:**
```python
@jwt_required()
def protected_route():
    current_user_id = get_jwt_identity()
    # ...
```

### 7.2 Role-Based Access Control (RBAC)

**Roles:**
- `student`: Xem problems, submit code, xem kết quả của mình
- `teacher`: Tạo class, tạo problems, xem tất cả submissions

**Implementation:**
```python
@role_required('teacher')
def teacher_only_endpoint():
    # Chỉ teacher truy cập được
```

**Role checks:**
```python
# Trong decorator
user = User.query.get(current_user_id)
if user.role.name != required_role:
    return jsonify({"msg": "Forbidden"}), 403
```

### 7.3 Permission Matrix

| Endpoint | Student | Teacher |
|----------|---------|---------|
| Register/Login | ✅ | ✅ |
| View Profile | ✅ | ✅ |
| Create Class | ❌ | ✅ |
| Join Class | ✅ | ❌ |
| Create Problem | ❌ | ✅ (own class) |
| View Problems | ✅ (joined class) | ✅ (own class) |
| Submit Code | ✅ (joined class) | ❌ |
| View Own Submissions | ✅ | ✅ |
| View All Submissions | ❌ | ✅ (own class) |

---

## 8. Message Queue System

### 8.1 RabbitMQ Architecture

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Backend    │         │  RabbitMQ    │         │    Worker    │
│  (Producer)  │────────▶│   (Broker)   │────────▶│  (Consumer)  │
└──────────────┘ publish └──────────────┘ consume └──────────────┘
                          │grading_queue │
                          │  (Durable)   │
                          └──────────────┘
```

### 8.2 Producer Implementation

**File:** `app/rabbitmq_producer.py`

```python
def publish_task(task_data):
    # 1. Connect to RabbitMQ
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(host=RABBITMQ_HOST)
    )
    channel = connection.channel()
    
    # 2. Declare queue (idempotent)
    channel.queue_declare(
        queue='grading_queue',
        durable=True  # Persist queue across broker restart
    )
    
    # 3. Publish message
    channel.basic_publish(
        exchange='',
        routing_key='grading_queue',
        body=json.dumps(task_data),
        properties=pika.BasicProperties(
            delivery_mode=2  # Persistent message
        )
    )
    
    connection.close()
```

### 8.3 Message Format

```json
{
  "submission_id": 123
}
```

**Worker sẽ:**
1. Fetch submission từ database
2. Fetch problem và test cases
3. Grade submission
4. POST kết quả về backend

### 8.4 Error Handling

```python
try:
    publish_task(task_data)
except pika.exceptions.AMQPConnectionError:
    # Log error
    # Implement retry logic
    # Alert monitoring system
```

**Cải tiến có thể thêm:**
- Exponential backoff retry
- Dead letter queue
- Message TTL
- Priority queue

---

## 9. Cấu Hình và Deployment

### 9.1 Environment Variables

**Required:**
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/codegrader

# Security
SECRET_KEY=your-super-secret-key-here

# RabbitMQ
RABBITMQ_HOST=localhost

# Flask
FLASK_ENV=production
FLASK_APP=run.py
```

### 9.2 Docker Configuration

**Dockerfile:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 5000

# Run application
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "run:app"]
```

**docker-compose.yml:**
```yaml
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/codegrader
      - RABBITMQ_HOST=rabbitmq
      - SECRET_KEY=${SECRET_KEY}
    depends_on:
      - db
      - rabbitmq
```

### 9.3 Database Migrations

**Initialize:**
```bash
flask db init
```

**Create migration:**
```bash
flask db migrate -m "Add new column"
```

**Apply migration:**
```bash
flask db upgrade
```

**Migration files:** `migrations/versions/`

### 9.4 Production Checklist

- [ ] Set `FLASK_ENV=production`
- [ ] Use strong `SECRET_KEY` (random 32+ chars)
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up logging
- [ ] Use Gunicorn/uWSGI (not Flask dev server)
- [ ] Configure database connection pool
- [ ] Set up monitoring (e.g., Sentry)
- [ ] Enable rate limiting
- [ ] Regular database backups
- [ ] Use environment-specific configs

---

## 10. Best Practices & Patterns

### 10.1 Code Organization

✅ **DO:**
- Use blueprints cho modular routing
- Tách business logic khỏi routes
- Use decorators cho cross-cutting concerns
- Keep models thin, use services cho complex logic

❌ **DON'T:**
- Hardcode configuration values
- Put business logic trong routes
- Duplicate code across routes
- Ignore error handling

### 10.2 Database Best Practices

✅ **DO:**
```python
# Use indexes
Column(..., index=True)

# Use cascade deletes
relationship(..., cascade="all, delete-orphan")

# Use eager loading để avoid N+1
Class.query.options(joinedload(Class.problems)).all()

# Close sessions properly
db.session.commit()
```

❌ **DON'T:**
```python
# N+1 queries
for class in classes:
    print(class.problems)  # Each triggers a query

# Forget to commit
db.session.add(user)
# Missing db.session.commit()
```

### 10.3 Security Best Practices

✅ **DO:**
- Hash passwords (Werkzeug)
- Use JWT với expiry
- Validate all inputs
- Use parameterized queries (SQLAlchemy handles này)
- Implement rate limiting
- Use HTTPS trong production

❌ **DON'T:**
- Store plain text passwords
- Use hardcoded secrets
- Trust client input
- Return detailed error messages trong production

### 10.4 API Design Best Practices

✅ **DO:**
- Use RESTful conventions
- Return appropriate HTTP status codes
- Use consistent naming (snake_case cho JSON)
- Version API (`/api/v1/...`)
- Document API (Swagger)

**Status codes:**
- `200 OK`: Successful GET/PUT/PATCH
- `201 Created`: Successful POST
- `202 Accepted`: Async processing started
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Missing/invalid token
- `403 Forbidden`: No permission
- `404 Not Found`: Resource không tồn tại
- `500 Internal Server Error`: Server error

### 10.5 Performance Optimization

**Database:**
- Use indexes cho frequently queried columns
- Use eager loading (`joinedload`)
- Cache computed values (`cached_score`)
- Paginate large result sets

**API:**
- Use compression (`Flask-Compress`)
- Implement caching (Redis)
- Use async processing (RabbitMQ)
- Rate limiting

**Code:**
- Avoid N+1 queries
- Use bulk operations
- Minimize database round trips
- Profile slow endpoints

### 10.6 Error Handling Pattern

```python
@app.errorhandler(404)
def not_found(error):
    return jsonify({"msg": "Resource not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({"msg": "Internal server error"}), 500

try:
    # Risky operation
    result = do_something()
except SpecificException as e:
    # Handle specific error
    return jsonify({"msg": str(e)}), 400
except Exception as e:
    # Log unexpected error
    app.logger.error(f"Unexpected error: {e}")
    return jsonify({"msg": "An error occurred"}), 500
```

---

## 📊 Tóm Tắt

Backend của Code Grader Project là một hệ thống:

**Kiến trúc:**
- ✅ RESTful API với Flask
- ✅ PostgreSQL database với SQLAlchemy ORM
- ✅ JWT authentication
- ✅ RabbitMQ message queue
- ✅ Docker containerized

**Tính năng chính:**
- ✅ User authentication & RBAC
- ✅ Class management
- ✅ Problem CRUD
- ✅ Async submission grading
- ✅ Real-time result tracking

**Best practices:**
- ✅ Application factory pattern
- ✅ Blueprint modular routing
- ✅ Environment-based configuration
- ✅ Database migrations
- ✅ Comprehensive error handling
- ✅ API documentation (Swagger)

**Security:**
- ✅ Password hashing
- ✅ JWT tokens
- ✅ Role-based permissions
- ✅ Input validation
- ✅ CORS configuration

---

## 📚 Tài Liệu Tham Khảo

- [Flask Documentation](https://flask.palletsprojects.com/)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org/)
- [Flask-JWT-Extended](https://flask-jwt-extended.readthedocs.io/)
- [RabbitMQ Tutorials](https://www.rabbitmq.com/tutorials)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Phiên bản:** 1.0  
**Ngày cập nhật:** {{ current_date }}  
**Tác giả:** Code Grader Development Team
