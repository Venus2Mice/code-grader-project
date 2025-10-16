# 🚀 LOCAL DEVELOPMENT SETUP

## 📋 Tổng Quan

Hệ thống chạy theo mô hình:
- **Docker Compose**: Backend, PostgreSQL, RabbitMQ
- **Local**: Frontend (Next.js), Worker (Python)

```
┌─────────────────────────────────────────────────┐
│  HOST MACHINE (Your Computer)                   │
│                                                  │
│  ┌──────────────────┐   ┌───────────────────┐  │
│  │ Frontend (Local) │   │ Worker (Local)    │  │
│  │ Port 3000        │   │ Python process    │  │
│  └────────┬─────────┘   └─────────┬─────────┘  │
│           │                       │             │
│           └───────┬───────────────┘             │
│                   │                             │
│  ┌────────────────▼─────────────────────────┐  │
│  │ Docker Compose (3 services)              │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ │  │
│  │  │ Backend  │ │ Postgres │ │ RabbitMQ │ │  │
│  │  │ :5000    │ │ :5432    │ │ :5672    │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## ⚡ Quick Start

### 1. Start Docker Services (Backend + DB + RabbitMQ)

```bash
# Khởi động 3 services
docker-compose up -d

# Kiểm tra services đang chạy
docker-compose ps
```

**Expected Output:**
```
NAME                      STATUS    PORTS
code-grader-backend-1     Up        0.0.0.0:5000->5000/tcp
code-grader-postgres-1    Up        0.0.0.0:5432->5432/tcp
code-grader-rabbitmq-1    Up        0.0.0.0:5672->5672/tcp, 0.0.0.0:15672->15672/tcp
```

### 2. Start Frontend (Terminal 1)

```bash
cd frontend-new

# Install dependencies (first time only)
npm install
# or
pnpm install

# Start development server
npm run dev
# or
pnpm dev
```

**Access:** http://localhost:3000

### 3. Start Worker (Terminal 2)

```bash
# Run worker script
./run_worker.sh
```

**Expected Output:**
```
Starting worker...
Successfully connected to RabbitMQ.
 [*] Waiting for tasks. To exit press CTRL+C
```

---

## 📁 File .env Configuration

### Root Level: `.env`
```properties
# Docker Compose Environment Variables
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123
POSTGRES_DB=code_grader
```

### Backend: `backend/.env`
```properties
# Backend runs in Docker
DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/code_grader
SECRET_KEY=backend-secret-key-change-in-production-67adsads78JKO9dH
FLASK_APP=run.py
FLASK_DEBUG=1
RABBITMQ_HOST=rabbitmq
```

### Frontend: `frontend-new/.env.local`
```bash
# Frontend runs on host
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Worker: `grader-engine/.env`
```properties
# Worker runs on host
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/code_grader
RABBITMQ_HOST=localhost
GRADER_TEMP_DIR=/workspaces/code-grader-project/grader-temp
HOST_GRADER_TEMP_DIR=/workspaces/code-grader-project/grader-temp
BACKEND_API_URL=http://localhost:5000
PYTHONUNBUFFERED=1
```

---

## 🔧 Common Commands

### Docker Services

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f backend

# Restart a service
docker-compose restart backend

# Rebuild and start
docker-compose up -d --build
```

### Backend (Inside Docker)

```bash
# Access backend container
docker exec -it code-grader-project-backend-1 bash

# Run migrations
flask db upgrade

# Seed database
flask seed_db
flask seed_test_data

# Exit container
exit
```

### Frontend

```bash
cd frontend-new

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Worker

```bash
# Start worker
./run_worker.sh

# Stop worker
# Press Ctrl+C in the terminal running worker
```

---

## 🔍 Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend API | 5000 | http://localhost:5000 |
| Swagger Docs | 5000 | http://localhost:5000/api/docs |
| PostgreSQL | 5432 | localhost:5432 |
| RabbitMQ AMQP | 5672 | localhost:5672 |
| RabbitMQ Management | 15672 | http://localhost:15672 |

### Default Accounts

**RabbitMQ Management:**
- Username: `guest`
- Password: `guest`

**Test Accounts:**
- Teacher: `teacher.dev@example.com` / `password`
- Student: `student.dev@example.com` / `password`

---

## 🐛 Troubleshooting

### Backend không start được

```bash
# Check logs
docker-compose logs backend

# Restart backend
docker-compose restart backend

# Rebuild backend
docker-compose up -d --build backend
```

### Frontend không kết nối được backend

```bash
# Check .env.local
cat frontend-new/.env.local
# Should have: NEXT_PUBLIC_API_URL=http://localhost:5000

# Test backend
curl http://localhost:5000/api/health
```

### Worker không nhận được tasks

```bash
# Check RabbitMQ
docker-compose ps rabbitmq

# Check worker .env
cat grader-engine/.env
# Should have: RABBITMQ_HOST=localhost

# Restart worker
# Press Ctrl+C and run ./run_worker.sh again
```

### Database connection errors

```bash
# Check PostgreSQL
docker-compose ps postgres

# Test connection
docker exec -it code-grader-project-postgres-1 psql -U postgres -d code_grader -c "SELECT 1"
```

---

## 🔄 Reset Everything

```bash
# Stop and remove all containers + volumes
docker-compose down -v

# Remove grader temp files
rm -rf grader-temp/*

# Start fresh
docker-compose up -d

# Run migrations
docker exec -it code-grader-project-backend-1 flask db upgrade
docker exec -it code-grader-project-backend-1 flask seed_db
docker exec -it code-grader-project-backend-1 flask seed_test_data

# Start worker
./run_worker.sh
```

---

## 📚 Next Steps

- **Full Documentation**: See `docs/DOCUMENTATION.md`
- **API Documentation**: http://localhost:5000/api/docs
- **Testing Guide**: See section 7 in `docs/DOCUMENTATION.md`

---

**🎉 Happy Coding!**
