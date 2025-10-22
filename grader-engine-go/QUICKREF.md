# 🚀 Quick Reference - Go Worker

## 📦 Project Structure

```
grader-engine-go/
├── main.go                    # Entry point
├── go.mod                     # Dependencies
├── Dockerfile                 # Container build
├── .env.example              # Config template
├── README.md                 # Documentation
├── MIGRATION.md              # Migration guide
├── COMPARISON.md             # Python vs Go
├── start.sh                  # Quick start
├── test.sh                   # Test suite
│
└── internal/
    ├── config/               # Configuration
    ├── models/               # Data models
    ├── database/             # DB connection
    ├── pool/                 # Container pool
    ├── worker/               # RabbitMQ consumer
    └── grader/               # Grading logic
        ├── service.go        # Main service
        ├── stdio.go          # STDIO grading
        ├── function.go       # Function grading
        └── helpers.go        # Utilities
```

## ⚡ Quick Commands

```bash
# Build
go build -o worker .

# Run
./worker

# Test
./test.sh

# Quick start
./start.sh

# Build Docker image
docker build -t grader-worker-go:latest .

# Run in Docker
docker run --env-file .env grader-worker-go:latest
```

## 🔧 Configuration (.env)

```bash
# Essential settings
RABBITMQ_HOST=localhost
DATABASE_URL=postgresql://user:pass@localhost:5432/db
BACKEND_API_URL=http://localhost:5000
DOCKER_IMAGE=cpp-grader-env
CONTAINER_POOL_SIZE=3
```

## 📊 Key Components

### Container Pool

```go
// Get container (max 10s wait)
containerID, err := pool.Get(10 * time.Second)

// Use container
// ... grading logic ...

// Always return
defer pool.Return(containerID)
```

### Grading Flow

```
1. Worker receives RabbitMQ message
   ↓
2. Parse submission ID
   ↓
3. Fetch from database (with eager loading)
   ↓
4. Get container from pool
   ↓
5. Copy source code to container
   ↓
6. Compile code
   ↓
7. Run test cases (sequential)
   ↓
8. Parse results (time, memory, exit code)
   ↓
9. Update backend (async)
   ↓
10. Return container to pool
```

## 🐛 Debugging

### Enable verbose logging

```go
// In database/database.go
Logger: logger.Default.LogMode(logger.Info)
```

### Check worker logs

```bash
./worker 2>&1 | tee worker.log
```

### Inspect container

```bash
# List containers
docker ps

# Exec into container
docker exec -it <container_id> /bin/bash

# Check sandbox
ls -la /sandbox/
```

## 📈 Performance Tuning

### Increase pool size

```bash
# .env
CONTAINER_POOL_SIZE=10  # Default: 3
```

### Run multiple workers

```bash
# Terminal 1
./worker &

# Terminal 2
./worker &

# Terminal 3
./worker &
```

### Resource limits

```go
// In pool/container_pool.go
Resources: container.Resources{
    Memory: 512 * 1024 * 1024,  // 512MB
    NanoCPUs: 2000000000,       // 2 CPUs
}
```

## 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| Container pool timeout | Increase `CONTAINER_POOL_SIZE` |
| Compilation fails | Check `DOCKER_IMAGE` exists |
| Database error | Verify `DATABASE_URL` |
| RabbitMQ connection | Check `RABBITMQ_HOST` |
| Out of memory | Reduce pool size or add RAM |

## 🧪 Testing

### Unit test (example)

```go
func TestGradeSubmission(t *testing.T) {
    // Setup
    cfg := config.Load()
    db := database.Connect(cfg.DatabaseURL)
    pool := pool.NewContainerPool(1, cfg.DockerImage)
    
    // Create service
    svc := grader.NewService(cfg, db, pool)
    
    // Test
    result, err := svc.GradeSubmission(123)
    
    // Assert
    assert.NoError(t, err)
    assert.Equal(t, "Accepted", result.OverallStatus)
}
```

### Integration test

```bash
# 1. Start worker
./worker &

# 2. Submit test via Python backend
curl -X POST http://localhost:5000/api/submissions \
  -H "Content-Type: application/json" \
  -d '{"problem_id": 1, "source_code": "..."}'

# 3. Check logs
tail -f worker.log

# 4. Verify in database
psql $DATABASE_URL -c "SELECT * FROM submissions ORDER BY id DESC LIMIT 1;"
```

## 📊 Monitoring

### Metrics to track

```bash
# Memory usage
ps aux | grep worker

# Goroutines
curl http://localhost:6060/debug/pprof/goroutine

# Container count
docker ps | grep cpp-grader-env | wc -l

# Queue depth
# Check RabbitMQ management UI
```

## 🚀 Deployment

### Systemd service

```ini
# /etc/systemd/system/grader-worker.service
[Unit]
Description=Go Grader Worker
After=network.target

[Service]
Type=simple
User=grader
WorkingDirectory=/opt/grader-engine-go
EnvironmentFile=/opt/grader-engine-go/.env
ExecStart=/opt/grader-engine-go/worker
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable grader-worker
sudo systemctl start grader-worker
sudo systemctl status grader-worker
```

### Docker Compose

```yaml
version: '3.8'
services:
  grader-worker:
    build: ./grader-engine-go
    environment:
      RABBITMQ_HOST: rabbitmq
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/code_grader
    depends_on:
      - rabbitmq
      - postgres
    restart: unless-stopped
```

## 🔐 Security

- ✅ Docker sandbox isolation
- ✅ Resource limits enforced
- ✅ No shell injection (direct API calls)
- ✅ Timeout protection
- ✅ Memory limits

## 📚 Resources

- [Go Documentation](https://go.dev/doc/)
- [Docker SDK](https://pkg.go.dev/github.com/docker/docker/client)
- [GORM](https://gorm.io/docs/)
- [RabbitMQ](https://pkg.go.dev/github.com/streadway/amqp)

## 💡 Tips

1. **Always defer cleanup**: `defer pool.Return(container)`
2. **Check errors explicitly**: `if err != nil { return err }`
3. **Use context with timeout**: `ctx, cancel := context.WithTimeout(...)`
4. **Log important events**: `log.Printf("[%d] Message", id)`
5. **Monitor goroutines**: Don't leak goroutines

## 🎯 Common Patterns

### Error wrapping

```go
if err := compile(code); err != nil {
    return fmt.Errorf("compilation failed: %w", err)
}
```

### Timeout context

```go
ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
defer cancel()

result, err := execWithContext(ctx, cmd)
```

### Goroutine with error handling

```go
errChan := make(chan error, 1)
go func() {
    errChan <- doWork()
}()

select {
case err := <-errChan:
    if err != nil {
        log.Printf("Error: %v", err)
    }
case <-time.After(10 * time.Second):
    log.Println("Timeout")
}
```

---

**Happy Grading! 🎓**
