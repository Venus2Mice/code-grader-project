# Backend - CodeGrader

RESTful API backend for the CodeGrader platform built with **Flask**, **PostgreSQL**, and **RabbitMQ**.

## ✨ Features

- 🔐 **JWT Authentication** - Secure user authentication and authorization
- 📝 **Problem Management** - Create, read, update, delete coding problems
- 👥 **Student Management** - User profiles and class enrollment
- 📊 **Submission Tracking** - Store and track code submissions
- 🐇 **RabbitMQ Integration** - Async communication with grading workers
- 🗄️ **PostgreSQL Database** - Persistent data storage with Alembic migrations
- 📚 **Swagger Documentation** - Auto-generated API documentation
- 🔄 **CORS Support** - Cross-origin requests for frontend communication
- 📝 **Structured Logging** - Comprehensive application logging

## 📋 Requirements

- **Python 3.9+**
- **PostgreSQL 12+**
- **RabbitMQ** (for async task processing)
- **Docker** (optional, for containerized setup)

## 🚀 Quick Start

### Option 1: Local Development (Standalone)

#### 1. Prerequisites
```bash
# Ensure Python 3.9+ and PostgreSQL are installed
python --version
psql --version
```

#### 2. Clone and Navigate
```bash
cd backend
```

#### 3. Create Virtual Environment
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

#### 4. Install Dependencies
```bash
pip install -r requirements.txt
```

#### 5. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your local settings:
```bash
# Database connection (local PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/code_grader_db

# Flask configuration
SECRET_KEY=your-secret-key-here
FLASK_APP=run.py
FLASK_DEBUG=1

# RabbitMQ connection (local instance)
RABBITMQ_HOST=localhost
```

#### 6. Setup Database
```bash
# Create database
createdb code_grader_db

# Run migrations
cd migrations
alembic upgrade head
cd ..
```

#### 7. Run Backend Server
```bash
python run.py
# → Server runs at http://localhost:5000
```

#### 8. Access API Documentation
```
http://localhost:5000/api/swagger/
```

---

### Option 2: Docker Setup (Recommended)

#### Prerequisites
```bash
# Ensure Docker and Docker Compose are installed
docker --version
docker-compose --version
```

#### 1. Navigate to Project Root
```bash
cd ..  # Go to project root
```

#### 2. Configure Environment
```bash
# Backend configuration
cd backend
cp .env.example .env
cd ..

# Frontend configuration (if needed)
cd frontend-vite
cp .env .env
cd ..
```

#### 3. Start Services
```bash
# Start all services (backend, frontend, database, rabbitmq)
docker-compose up -d

# View logs
docker-compose logs -f backend
```

#### 4. Database Setup (First Time)
```bash
# Run migrations inside container
docker-compose exec backend sh -c "cd migrations && alembic upgrade head"
```

#### 5. Access Services

| Service | URL |
|---------|-----|
| Backend API | http://localhost:5000 |
| API Documentation | http://localhost:5000/api/swagger/ |
| Frontend | http://localhost:3000 |
| Database | localhost:5432 |
| RabbitMQ Admin | http://localhost:15672 |

#### 6. Stop Services
```bash
docker-compose down

# Remove volumes (caution: deletes data)
docker-compose down -v
```

---

## 📁 Project Structure

```
backend/
├── app/
│   ├── __init__.py              # Flask app initialization
│   ├── models.py                # Database models
│   ├── schemas.py               # Request/Response schemas
│   ├── config.py                # Configuration
│   ├── logging_config.py         # Logging setup
│   ├── decorators.py             # Custom decorators
│   ├── exceptions.py             # Custom exceptions
│   ├── error_handlers.py         # Error handling
│   ├── cleanup_service.py        # Cleanup utilities
│   ├── commands.py               # CLI commands
│   ├── rabbitmq_producer.py      # Message queue producer
│   ├── routes/                   # API endpoints
│   │   ├── auth_routes.py        # Authentication endpoints
│   │   ├── student_routes.py     # Student management
│   │   ├── class_routes.py       # Class management
│   │   ├── problem_routes.py     # Problem management
│   │   ├── submission_routes.py  # Submission endpoints
│   │   └── health_routes.py      # Health check
│   └── static/
│       └── swagger.json          # Swagger documentation
├── migrations/                   # Database migrations (Alembic)
├── logs/                         # Application logs
├── .env.example                  # Environment template
├── .dockerignore                 # Docker ignore rules
├── requirements.txt              # Python dependencies
├── run.py                        # Application entry point
├── startup.py                    # Startup configuration
├── Dockerfile                    # Docker configuration
└── README.md                     # This file
```

---

## 🔧 Configuration

### Environment Variables

Create or update `.env` file:

```bash
# Database
DATABASE_URL=postgresql://user:password@postgres:5432/code_grader_db

# Flask
SECRET_KEY=your-secret-key-minimum-32-characters
FLASK_APP=run.py
FLASK_DEBUG=0  # Set to 0 in production

# RabbitMQ
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest

# API
API_PORT=5000
API_HOST=0.0.0.0

# Logging
LOG_LEVEL=INFO
```

### Database Migrations

Alembic is used for database schema management.

```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Revert last migration
alembic downgrade -1

# View migration history
alembic history
```

---

## 🧪 Testing

```bash
# Run error handling tests
python test_error_handling.py

# Run logging tests
python test_logging_fix.py

# Run with unittest
python -m unittest discover -s . -p "test_*.py"
```

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token

### Students
- `GET /api/students` - List all students
- `GET /api/students/<id>` - Get student details
- `PUT /api/students/<id>` - Update student profile

### Classes
- `GET /api/classes` - List classes
- `POST /api/classes` - Create class
- `GET /api/classes/<id>` - Get class details
- `DELETE /api/classes/<id>` - Delete class

### Problems
- `GET /api/problems` - List problems
- `POST /api/problems` - Create problem
- `GET /api/problems/<id>` - Get problem details
- `PUT /api/problems/<id>` - Update problem
- `DELETE /api/problems/<id>` - Delete problem

### Submissions
- `POST /api/submissions` - Submit code
- `GET /api/submissions/<id>` - Get submission details
- `GET /api/submissions` - List submissions

### Health Check
- `GET /api/health` - Service health status

See full documentation at `/api/swagger/`

---

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
psql --version

# Check DATABASE_URL in .env
# Format: postgresql://user:password@host:port/dbname
```

### RabbitMQ Connection Error
```bash
# Check RabbitMQ is running
# Docker: docker ps | grep rabbitmq
# Local: rabbitmq-server status

# Check RABBITMQ_HOST in .env
```

### Migration Errors
```bash
# Check current migration status
alembic current

# Review migration files in migrations/versions/
ls migrations/versions/

# Reset database (WARNING: deletes all data)
alembic downgrade base
alembic upgrade head
```

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill process (if needed)
kill -9 <PID>
```

---

## 🚀 Deployment

### Production Checklist

- [ ] Set `FLASK_DEBUG=0`
- [ ] Generate strong `SECRET_KEY`
- [ ] Configure production `DATABASE_URL`
- [ ] Setup RabbitMQ with authentication
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS for frontend domain
- [ ] Setup application monitoring
- [ ] Configure log aggregation
- [ ] Test graceful shutdown
- [ ] Setup backup strategy

### Docker Production Build
```bash
docker build -f backend/Dockerfile -t code-grader-backend:latest .
docker run -d \
  --env-file .env \
  -p 5000:5000 \
  --network code-grader-network \
  code-grader-backend:latest
```

---

## 📚 Documentation

- [API Documentation](./docs/BACKEND_DOCUMENTATION.md)
- [Database Schema](./docs/DATABASE_SCHEMA.md)
- [Installation Guide](./docs/INSTALLATION.md)

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests
4. Submit pull request

---

## 📝 License

This project is part of CodeGrader platform.

---

## 💬 Support

For issues or questions:
1. Check this README
2. Review [API Documentation](./docs/BACKEND_DOCUMENTATION.md)
3. Check logs: `docker-compose logs backend`
4. Create an issue in the repository

---

**Last Updated**: October 28, 2025
