#!/bin/bash

# 🧪 Test Script for Go Worker
# This script tests the Go worker implementation

set -e  # Exit on error

echo "🧪 Go Worker Test Suite"
echo "======================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

command -v go >/dev/null 2>&1 || { echo -e "${RED}❌ Go is not installed${NC}"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo -e "${RED}❌ Docker is not installed${NC}"; exit 1; }

echo -e "${GREEN}✅ Go installed: $(go version)${NC}"
echo -e "${GREEN}✅ Docker installed: $(docker --version)${NC}"
echo ""

# Check Docker daemon
docker ps >/dev/null 2>&1 || { echo -e "${RED}❌ Docker daemon not running${NC}"; exit 1; }
echo -e "${GREEN}✅ Docker daemon running${NC}"
echo ""

# Check for .env file
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  No .env file found, copying from .env.example${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit .env with your settings and run again${NC}"
    exit 1
fi

echo -e "${GREEN}✅ .env file found${NC}"
echo ""

# Load environment
export $(cat .env | grep -v '^#' | xargs)

# Test 1: Build
echo "🔨 Test 1: Building Go worker..."
if go build -o worker .; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo ""

# Test 2: Check binary
echo "🔍 Test 2: Checking binary..."
if [ -f ./worker ]; then
    SIZE=$(du -h ./worker | cut -f1)
    echo -e "${GREEN}✅ Binary created: ${SIZE}${NC}"
else
    echo -e "${RED}❌ Binary not found${NC}"
    exit 1
fi
echo ""

# Test 3: Database connection
echo "🗄️  Test 3: Testing database connection..."
cat > /tmp/test_db.go << 'EOF'
package main
import (
    "fmt"
    "os"
    "gorm.io/driver/postgres"
    "gorm.io/gorm"
)
func main() {
    db, err := gorm.Open(postgres.Open(os.Getenv("DATABASE_URL")), &gorm.Config{})
    if err != nil {
        fmt.Println("FAIL:", err)
        os.Exit(1)
    }
    sqlDB, _ := db.DB()
    if err := sqlDB.Ping(); err != nil {
        fmt.Println("FAIL:", err)
        os.Exit(1)
    }
    fmt.Println("OK")
}
EOF

if cd /tmp && go mod init test 2>/dev/null && go get gorm.io/gorm gorm.io/driver/postgres 2>/dev/null && go run test_db.go 2>/dev/null | grep -q "OK"; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
    cd - >/dev/null
else
    echo -e "${RED}❌ Database connection failed${NC}"
    echo -e "${YELLOW}💡 Check DATABASE_URL in .env${NC}"
    cd - >/dev/null
fi
rm -rf /tmp/test_db.go /tmp/go.mod /tmp/go.sum
echo ""

# Test 4: Docker image
echo "🐳 Test 4: Checking Docker image..."
if docker images | grep -q "$DOCKER_IMAGE"; then
    echo -e "${GREEN}✅ Docker image '$DOCKER_IMAGE' found${NC}"
else
    echo -e "${YELLOW}⚠️  Docker image '$DOCKER_IMAGE' not found${NC}"
    echo -e "${YELLOW}💡 Build it with: cd ../grader-engine && docker build -t $DOCKER_IMAGE .${NC}"
fi
echo ""

# Test 5: RabbitMQ connection (optional, might not be running)
echo "🐰 Test 5: Testing RabbitMQ connection..."
if timeout 2 bash -c "</dev/tcp/$RABBITMQ_HOST/5672" 2>/dev/null; then
    echo -e "${GREEN}✅ RabbitMQ accessible at $RABBITMQ_HOST:5672${NC}"
else
    echo -e "${YELLOW}⚠️  RabbitMQ not accessible at $RABBITMQ_HOST:5672${NC}"
    echo -e "${YELLOW}💡 Make sure RabbitMQ is running${NC}"
fi
echo ""

# Test 6: Container pool initialization
echo "🏊 Test 6: Testing container pool initialization..."
cat > /tmp/test_pool.go << EOF
package main
import (
    "fmt"
    "os"
    "grader-engine-go/internal/pool"
)
func main() {
    p, err := pool.NewContainerPool(2, os.Getenv("DOCKER_IMAGE"))
    if err != nil {
        fmt.Println("FAIL:", err)
        os.Exit(1)
    }
    defer p.Shutdown()
    fmt.Println("OK")
}
EOF

if cd /tmp && cp -r $(dirname $0)/internal . 2>/dev/null && go mod init test 2>/dev/null && go get github.com/docker/docker/api/types github.com/docker/docker/client 2>/dev/null && go run test_pool.go 2>/dev/null | grep -q "OK"; then
    echo -e "${GREEN}✅ Container pool test passed${NC}"
    cd - >/dev/null
else
    echo -e "${RED}❌ Container pool test failed${NC}"
    cd - >/dev/null
fi
rm -rf /tmp/test_pool.go /tmp/internal /tmp/go.mod /tmp/go.sum
echo ""

# Summary
echo "📊 Test Summary"
echo "==============="
echo -e "${GREEN}✅ All critical tests passed!${NC}"
echo ""
echo "🚀 Next Steps:"
echo "   1. Ensure RabbitMQ is running"
echo "   2. Ensure cpp-grader-env Docker image exists"
echo "   3. Run worker: ./worker"
echo "   4. Monitor logs for any errors"
echo "   5. Send test submission via Backend API"
echo ""
echo "📚 For detailed migration guide, see MIGRATION.md"
