# Hot Reload Configuration Guide

## 📋 Overview

Project này đã được cấu hình với **hot reload** cho tất cả services trong development mode, giúp developers không cần rebuild/restart container khi code thay đổi.

---

## 🔥 Development Mode (Hot Reload Enabled)

### ✅ Services với Hot Reload:

1. **Frontend (Vite + React)**
   - Tool: Vite HMR (Hot Module Replacement)
   - Port: 5173
   - Config: `frontend-vite/Dockerfile.dev`
   - Volume: `./frontend-vite:/app`

2. **Backend (Flask)**
   - Tool: Flask debug mode + Werkzeug reloader
   - Port: 5000
   - Config: Built-in Flask `FLASK_DEBUG=1`
   - Volume: `./backend:/app`

3. **Worker (Go)**
   - Tool: Air (cosmtrek/air)
   - Port: 8080
   - Config: `grader-engine-go/.air.toml`
   - Volume: `./grader-engine-go:/app`

---

## 🚀 How to Use

### Start Development Mode:
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Watch Logs:
```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f frontend
docker-compose -f docker-compose.dev.yml logs -f backend
docker-compose -f docker-compose.dev.yml logs -f worker
```

### Stop:
```bash
docker-compose -f docker-compose.dev.yml down
```

---

## 📝 What Happens When You Edit Code?

### Frontend (Vite):
1. Edit any `.tsx`, `.ts`, `.css` file in `frontend-vite/src/`
2. Vite detects change instantly
3. Browser auto-refreshes (HMR)
4. **No rebuild needed** ⚡

### Backend (Flask):
1. Edit any `.py` file in `backend/app/`
2. Flask detects change
3. Auto reloads Flask server
4. **No restart needed** ⚡

### Worker (Go):
1. Edit any `.go` file in `grader-engine-go/`
2. Air detects change
3. Auto rebuilds Go binary
4. Auto restarts worker
5. **No manual rebuild needed** ⚡

---

## ⚙️ Configuration Files

### Frontend: `frontend-vite/Dockerfile.dev`
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

### Worker: `grader-engine-go/.air.toml`
```toml
[build]
  cmd = "go build -o ./tmp/main ."
  bin = "./tmp/main"
  delay = 1000
  include_ext = ["go", "tpl", "tmpl", "html"]
  exclude_dir = ["assets", "tmp", "vendor", "testdata"]
```

### Backend: Already configured
- Flask debug mode enabled via `FLASK_DEBUG=1`
- Auto reload on file changes

---

## 🔄 Switching Between Modes

### Development → Production:
```bash
docker-compose -f docker-compose.dev.yml down
docker-compose up -d
```

### Production → Development:
```bash
docker-compose down
docker-compose -f docker-compose.dev.yml up -d
```

---

## 🐛 Troubleshooting

### Frontend không reload:

**Check 1:** Vite dev server có chạy không?
```bash
docker-compose -f docker-compose.dev.yml logs frontend
```

**Check 2:** Volume có được mount đúng không?
```bash
docker-compose -f docker-compose.dev.yml exec frontend ls -la /app/src
```

**Fix:** Restart frontend service
```bash
docker-compose -f docker-compose.dev.yml restart frontend
```

---

### Backend không reload:

**Check 1:** Flask debug mode có enabled không?
```bash
docker-compose -f docker-compose.dev.yml exec backend env | grep FLASK_DEBUG
# Should output: FLASK_DEBUG=1
```

**Check 2:** Volume có được mount đúng không?
```bash
docker-compose -f docker-compose.dev.yml exec backend ls -la /app/app
```

**Fix:** Restart backend service
```bash
docker-compose -f docker-compose.dev.yml restart backend
```

---

### Worker không rebuild:

**Check 1:** Air có chạy không?
```bash
docker-compose -f docker-compose.dev.yml logs worker
# Should see: "Building..." when files change
```

**Check 2:** .air.toml có tồn tại không?
```bash
docker-compose -f docker-compose.dev.yml exec worker ls -la /app/.air.toml
```

**Fix 1:** Restart worker service
```bash
docker-compose -f docker-compose.dev.yml restart worker
```

**Fix 2:** Rebuild worker image
```bash
docker-compose -f docker-compose.dev.yml build worker
docker-compose -f docker-compose.dev.yml up -d worker
```

---

### Volume mount issues (Windows):

**Problem:** Files không sync giữa host và container

**Solution 1:** Enable WSL2 integration trong Docker Desktop
1. Docker Desktop → Settings → Resources → WSL Integration
2. Enable WSL2-based engine
3. Restart Docker Desktop

**Solution 2:** Check file sharing settings
1. Docker Desktop → Settings → Resources → File Sharing
2. Add project directory
3. Apply & Restart

---

## 📊 Performance Comparison

| Metric | Development Mode | Production Mode |
|--------|------------------|-----------------|
| **Startup Time** | ~30s | ~60s (build time) |
| **Code Change → See Result** | 1-3s | Manual rebuild needed |
| **Image Size** | Larger (dev tools) | Smaller (optimized) |
| **Memory Usage** | Higher | Lower |
| **CPU Usage** | Higher (watching files) | Lower |

---

## 🎯 Best Practices

1. **Use dev mode for development** - faster feedback loop
2. **Test in production mode before deploy** - catch build issues early
3. **Don't commit `tmp/` or build artifacts** - already in .gitignore
4. **Monitor resource usage** - dev mode uses more resources
5. **Restart if something feels off** - hot reload isn't perfect

---

## 📚 References

- [Vite Dev Server](https://vitejs.dev/guide/)
- [Flask Debug Mode](https://flask.palletsprojects.com/en/2.3.x/config/#DEBUG)
- [Air (Go Hot Reload)](https://github.com/cosmtrek/air)
- [Docker Volume Mounts](https://docs.docker.com/storage/volumes/)

---

**🎉 Happy Coding with Hot Reload!**
