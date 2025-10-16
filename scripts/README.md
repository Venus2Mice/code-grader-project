# 🔧 Scripts

Thư mục này chứa các script tiện ích cho việc setup và vận hành dự án.

## 📜 Danh sách Scripts

### `setup.sh`
**Mô tả**: Script tự động setup toàn bộ môi trường phát triển

**Chức năng**:
- ✅ Cài đặt dependencies cho backend (Python packages)
- ✅ Cài đặt dependencies cho frontend (npm/pnpm packages)
- ✅ Setup database (create, migrate)
- ✅ Seed initial data (roles, test users)
- ✅ Kiểm tra services (PostgreSQL, RabbitMQ)

**Cách sử dụng**:
```bash
cd /workspaces/code-grader-project
./scripts/setup.sh
```

**Requirements**:
- Python 3.9+
- Node.js 18+
- PostgreSQL
- RabbitMQ

---

### `run_worker.sh`
**Mô tả**: Script chạy grader worker để xử lý submissions

**Chức năng**:
- ✅ Kích hoạt Python virtual environment
- ✅ Chạy worker process
- ✅ Connect tới RabbitMQ queue
- ✅ Lắng nghe và xử lý submission tasks

**Cách sử dụng**:
```bash
cd /workspaces/code-grader-project
./scripts/run_worker.sh
```

**Lưu ý**:
- RabbitMQ phải đang chạy
- Backend API phải đang chạy (để worker callback results)
- Worker sẽ chạy trong foreground - dùng terminal riêng

---

## 🚀 Quick Start Flow

### Development Setup (lần đầu):
```bash
# 1. Clone repo
git clone <repo-url>
cd code-grader-project

# 2. Chạy setup
./scripts/setup.sh

# 3. Start services với Docker Compose
docker-compose up -d  # postgres, rabbitmq

# 4. Start backend (terminal 1)
cd backend
source venv/bin/activate
python run.py

# 5. Start worker (terminal 2)
./scripts/run_worker.sh

# 6. Start frontend (terminal 3)
cd frontend-new
pnpm dev
```

### Daily Development:
```bash
# Terminal 1: Backend
cd backend && source venv/bin/activate && python run.py

# Terminal 2: Worker
./scripts/run_worker.sh

# Terminal 3: Frontend
cd frontend-new && pnpm dev
```

---

## 🛠️ Troubleshooting

### Setup.sh fails
```bash
# Kiểm tra Python version
python3 --version  # Cần >= 3.9

# Kiểm tra PostgreSQL
psql --version
sudo service postgresql status

# Kiểm tra RabbitMQ
sudo service rabbitmq-server status
```

### Worker không nhận jobs
```bash
# 1. Kiểm tra RabbitMQ running
sudo service rabbitmq-server status

# 2. Kiểm tra queue exists
# Truy cập RabbitMQ Management: http://localhost:15672
# Username: guest, Password: guest

# 3. Check worker logs
./scripts/run_worker.sh  # Xem error messages
```

### Permission denied
```bash
# Cấp quyền execute cho scripts
chmod +x scripts/*.sh
```

---

## 📝 Maintenance Scripts (TODO)

Các scripts bổ sung có thể thêm:
- `backup_db.sh` - Backup database
- `restore_db.sh` - Restore database từ backup
- `clear_queue.sh` - Clear RabbitMQ queue
- `health_check.sh` - Kiểm tra health của services
- `deploy.sh` - Deploy lên production

---

## 💡 Tips

### Running in Background
```bash
# Backend
cd backend && source venv/bin/activate
nohup python run.py > logs/backend.log 2>&1 &

# Worker
nohup ./scripts/run_worker.sh > logs/worker.log 2>&1 &

# View logs
tail -f logs/backend.log
tail -f logs/worker.log
```

### Auto-restart on crash
```bash
# Dùng systemd hoặc supervisor (production)
# Hoặc simple while loop (dev)
while true; do
  ./scripts/run_worker.sh
  echo "Worker crashed, restarting in 5s..."
  sleep 5
done
```

---

## 📞 Support

Nếu gặp vấn đề với scripts:
1. Kiểm tra logs trong terminal
2. Xem [docs/COMPLETE_GUIDE.md](../docs/COMPLETE_GUIDE.md)
3. Tạo issue trên GitHub với error logs
