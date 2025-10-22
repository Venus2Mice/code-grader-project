# 🔄 Migration Guide: Python Worker → Go Worker

## 📋 Overview

This guide helps you migrate from Python worker to Go worker with minimal downtime.

## ✅ Pre-Migration Checklist

- [ ] Go 1.21+ installed
- [ ] Docker daemon running
- [ ] RabbitMQ accessible
- [ ] PostgreSQL accessible
- [ ] Current Python worker functioning
- [ ] Backup database

## 🚀 Quick Start (Parallel Testing)

### Step 1: Build Go Worker

```bash
cd grader-engine-go
cp .env.example .env
# Edit .env with your settings
go mod download
go build -o worker .
```

### Step 2: Test Go Worker (Different Queue)

Temporarily use a different queue for testing:

```bash
# Edit .env
RABBITMQ_QUEUE=grading_queue_go_test

# Start Go worker
./worker
```

### Step 3: Send Test Submission

In Python, modify publisher temporarily:

```python
# Send to test queue
publish_task({'submission_id': 123}, queue='grading_queue_go_test')
```

### Step 4: Verify Results

Check logs and database for correct grading results.

## 🔄 Full Migration

### Option A: Zero Downtime (Recommended)

```bash
# Terminal 1: Keep Python worker running
cd grader-engine
python run.py

# Terminal 2: Start Go worker (same queue)
cd grader-engine-go
./worker

# Both workers will compete for messages
# Gradually increase Go workers, decrease Python workers
# Monitor logs and errors

# After 1 hour of stable operation:
# Stop Python worker
# Keep only Go workers
```

### Option B: Quick Switch

```bash
# Stop Python worker
pkill -f "python.*run.py"

# Start Go worker
cd grader-engine-go
./worker

# Monitor logs for 10 minutes
# If issues, rollback:
# pkill -f worker
# python grader-engine/run.py
```

## 📊 Monitoring

### Key Metrics to Watch

```bash
# Go worker logs
tail -f grader-engine-go.log

# Look for:
# ✅ "Successfully updated backend" 
# ❌ "Failed to grade submission"
# 🐳 Container pool health
# 📨 Message processing rate
```

### Database Queries

```sql
-- Check recent submissions
SELECT id, status, submitted_at 
FROM submissions 
WHERE submitted_at > NOW() - INTERVAL '1 hour'
ORDER BY submitted_at DESC;

-- Count by status
SELECT status, COUNT(*) 
FROM submissions 
WHERE submitted_at > NOW() - INTERVAL '1 hour'
GROUP BY status;

-- Find System Errors
SELECT id, source_code 
FROM submissions 
WHERE status = 'System Error' 
  AND submitted_at > NOW() - INTERVAL '1 hour';
```

## 🐛 Troubleshooting

### Issue: "Failed to get container from pool"

```bash
# Check Docker daemon
docker ps

# Check Docker image exists
docker images | grep cpp-grader-env

# Rebuild if needed
cd grader-engine
docker build -t cpp-grader-env .
```

### Issue: "Failed to connect to RabbitMQ"

```bash
# Check RabbitMQ is running
docker ps | grep rabbitmq

# Check connection
telnet localhost 5672

# Check queue exists
# Visit http://localhost:15672 (guest/guest)
```

### Issue: "Failed to connect to database"

```bash
# Test connection
psql postgresql://postgres:postgres@localhost:5432/code_grader

# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL
```

### Issue: Compilation errors in Go

```bash
# Clear module cache
go clean -modcache

# Re-download dependencies
go mod download

# Build with verbose
go build -v -o worker .
```

## 🔙 Rollback Plan

If Go worker has critical issues:

```bash
# 1. Stop Go worker immediately
pkill -f "./worker"

# 2. Start Python worker
cd grader-engine
source venv/bin/activate  # if using venv
python run.py

# 3. Clear stuck messages in queue (if any)
# Visit RabbitMQ management UI
# Purge grading_queue if needed

# 4. Monitor Python worker logs
tail -f logs/worker.log
```

## 📈 Performance Comparison

Expected improvements:

| Metric | Python | Go | Improvement |
|--------|--------|-----|-------------|
| Startup | 1-2s | 20ms | **50-100x faster** |
| Memory | 80-150MB | 15-30MB | **5x less** |
| Throughput | 1-3 sub/s | 10-50 sub/s | **10-50x faster** |
| Container reuse | 200ms | 50ms | **4x faster** |

## ✅ Success Criteria

After 24 hours of Go worker running:

- [ ] Zero "System Error" submissions (unless code issue)
- [ ] All test cases pass correctly
- [ ] Memory stable (no leaks)
- [ ] CPU usage acceptable
- [ ] No container pool exhaustion
- [ ] Backend updates successful
- [ ] Same verdict as Python worker (spot check)

## 🎯 Post-Migration

### 1. Update Docker Compose (if using)

```yaml
# docker-compose.yml
services:
  grader-worker:
    build: ./grader-engine-go
    image: grader-worker-go:latest
    environment:
      - RABBITMQ_HOST=rabbitmq
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/code_grader
      - BACKEND_API_URL=http://backend:5000
    depends_on:
      - rabbitmq
      - postgres
```

### 2. Scale Workers

```bash
# Run multiple Go workers for high load
for i in {1..5}; do
  ./worker &
done

# Or with Docker
docker-compose up --scale grader-worker=5
```

### 3. Remove Python Worker

```bash
# After 1 week of stable Go worker:
rm -rf grader-engine/worker/
# Keep grader-engine/Dockerfile for cpp-grader-env
```

## 📝 Notes

- Go worker is **drop-in compatible** with existing system
- Same database schema, no migrations needed
- Same RabbitMQ message format
- Same Backend API contract
- Can run both workers simultaneously for gradual migration

## 🆘 Support

If you encounter issues:

1. Check logs: `./worker` output
2. Check database: submission status
3. Check Docker: `docker ps`, `docker logs <container>`
4. Check RabbitMQ: management UI
5. Rollback to Python if critical

## 🎓 Learning Resources

- [Go Documentation](https://go.dev/doc/)
- [Docker Go SDK](https://docs.docker.com/engine/api/sdk/examples/)
- [GORM Guide](https://gorm.io/docs/)
- [RabbitMQ Go Tutorial](https://www.rabbitmq.com/tutorials/tutorial-one-go.html)
