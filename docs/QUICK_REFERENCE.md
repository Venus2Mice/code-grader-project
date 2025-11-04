# 🚀 Quick Reference - Development Commands

## 📋 Helper Scripts (Khuyên dùng)

### Development Mode (Hot Reload)
```bash
./dev.sh start      # Start all services with hot reload
./dev.sh stop       # Stop all services
./dev.sh restart    # Restart all services
./dev.sh logs       # View logs (follow mode)
./dev.sh build      # Rebuild all images
./dev.sh status     # Show service status
./dev.sh clean      # Clean all containers/volumes/images
```

### Production Mode
```bash
./prod.sh start     # Start all services (production build)
./prod.sh stop      # Stop all services
./prod.sh restart   # Restart all services
./prod.sh logs      # View logs (follow mode)
./prod.sh build     # Rebuild all images
./prod.sh status    # Show service status
./prod.sh clean     # Clean all containers/volumes/images
```

---

## 🐳 Docker Compose Commands (Direct)

### Development Mode
```bash
# Start
docker-compose -f docker-compose.dev.yml up -d

# Stop
docker-compose -f docker-compose.dev.yml down

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Rebuild
docker-compose -f docker-compose.dev.yml build --no-cache

# Restart single service
docker-compose -f docker-compose.dev.yml restart frontend
docker-compose -f docker-compose.dev.yml restart backend
docker-compose -f docker-compose.dev.yml restart worker
```

### Production Mode
```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f

# Rebuild
docker-compose build --no-cache

# Restart single service
docker-compose restart frontend
docker-compose restart backend
docker-compose restart worker
```

---

## 📊 Service URLs

### Development Mode
- **Frontend (Vite)**: http://localhost:5173
- **Backend (Flask)**: http://localhost:5000
- **Worker (Go)**: http://localhost:8080
- **RabbitMQ UI**: http://localhost:15672 (guest/guest)
- **PostgreSQL**: localhost:5432

### Production Mode
- **Frontend (Nginx)**: http://localhost:3000
- **Backend (Flask)**: http://localhost:5000
- **Worker (Go)**: http://localhost:8080
- **RabbitMQ UI**: http://localhost:15672 (guest/guest)
- **PostgreSQL**: localhost:5432

---

## 🔍 Debugging Commands

### Check service status
```bash
# Development
docker-compose -f docker-compose.dev.yml ps

# Production
docker-compose ps
```

### View logs for specific service
```bash
# Development
docker-compose -f docker-compose.dev.yml logs -f frontend
docker-compose -f docker-compose.dev.yml logs -f backend
docker-compose -f docker-compose.dev.yml logs -f worker

# Production
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f worker
```

### Enter container shell
```bash
# Development
docker-compose -f docker-compose.dev.yml exec frontend sh
docker-compose -f docker-compose.dev.yml exec backend bash
docker-compose -f docker-compose.dev.yml exec worker sh

# Production
docker-compose exec frontend sh
docker-compose exec backend bash
docker-compose exec worker sh
```

### Check container resource usage
```bash
docker stats
```

---

## 🛠️ Troubleshooting

### Port already in use
```bash
# Find process using port (Linux/Mac)
lsof -i :5173
lsof -i :5000
lsof -i :8080

# Find process using port (Windows PowerShell)
netstat -ano | findstr :5173
netstat -ano | findstr :5000
netstat -ano | findstr :8080

# Kill process
kill -9 <PID>  # Linux/Mac
taskkill /PID <PID> /F  # Windows
```

### Clean everything and start fresh
```bash
# Stop all containers
docker-compose -f docker-compose.dev.yml down -v
docker-compose down -v

# Remove all images
docker rmi $(docker images -q)

# Remove all volumes
docker volume prune -f

# Rebuild from scratch
./dev.sh build
./dev.sh start
```

### Volume permission issues (Linux)
```bash
# Fix permissions
sudo chown -R $USER:$USER .

# Or run with sudo (not recommended)
sudo docker-compose -f docker-compose.dev.yml up -d
```

---

## 🔄 Hot Reload Testing

### Frontend (Vite)
1. Edit any file in `frontend-vite/src/`
2. Save the file
3. Browser should auto-refresh within 1-2 seconds
4. Check logs: `./dev.sh logs` or `docker-compose -f docker-compose.dev.yml logs -f frontend`

### Backend (Flask)
1. Edit any file in `backend/app/`
2. Save the file
3. Flask should reload within 2-3 seconds
4. Check logs: `./dev.sh logs` or `docker-compose -f docker-compose.dev.yml logs -f backend`

### Worker (Go)
1. Edit any `.go` file in `grader-engine-go/`
2. Save the file
3. Air should rebuild and restart within 3-5 seconds
4. Check logs: `./dev.sh logs` or `docker-compose -f docker-compose.dev.yml logs -f worker`
5. Look for "Building..." and "Build finished" messages

---

## 📦 Build Sandbox Image

```bash
# Development
docker build -t code-grader-project-sandbox:latest -f grader-engine-go/Dockerfile.sandbox grader-engine-go

# Check if image exists
docker images | grep sandbox
```

---

## 🧪 Test Accounts

- **Teacher**: `teacher.test@example.com` / `password123`
- **Student**: `student.test@example.com` / `password123`

---

## 📚 More Help

- Full documentation: `docs/BACKEND_DOCUMENTATION.md`
- Hot reload guide: `HOT_RELOAD_GUIDE.md`
- Development script help: `./dev.sh help`
- Production script help: `./prod.sh help`
