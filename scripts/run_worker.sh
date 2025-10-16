#!/bin/bash

# ==============================================================================
# Script chạy Worker độc lập (không dùng Docker)
# ==============================================================================

Color_Off='\033[0m'
BGreen='\033[1;32m'
BYellow='\033[1;33m'
BRed='\033[1;31m'

function print_success { echo -e "${BGreen}✓ $1${Color_Off}"; }
function print_info { echo -e "${BYellow}INFO: $1${Color_Off}"; }
function print_error_and_exit { echo -e "${BRed}ERROR: $1${Color_Off}"; exit 1; }

set -e

# Kiểm tra file .env
if [ ! -f .env ]; then
    print_error_and_exit "File '.env' không tồn tại!"
fi

# Load biến môi trường từ .env
source .env

# Lấy đường dẫn tuyệt đối của thư mục hiện tại
CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Thiết lập biến môi trường cho worker
# Use 127.0.0.1 instead of localhost to force IPv4 connection (avoid IPv6 ::1 issues)
export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@127.0.0.1:5432/${POSTGRES_DB}"
export RABBITMQ_HOST=localhost
export BACKEND_API_URL=http://localhost:5000
export GRADER_TEMP_DIR="${CURRENT_DIR}/grader-temp"
export HOST_GRADER_TEMP_DIR="${CURRENT_DIR}/grader-temp"

# Tạo thư mục tạm nếu chưa có
mkdir -p "$GRADER_TEMP_DIR"
print_success "Thư mục tạm: $GRADER_TEMP_DIR"

# Kiểm tra các service cần thiết
print_info "Kiểm tra PostgreSQL..."
if ! docker ps | grep -q "code-grader-project-postgres-1"; then
    print_error_and_exit "PostgreSQL không chạy! Hãy chạy: docker-compose up -d postgres"
fi
print_success "PostgreSQL đang chạy"

print_info "Kiểm tra RabbitMQ..."
if ! docker ps | grep -q "code-grader-project-rabbitmq-1"; then
    print_error_and_exit "RabbitMQ không chạy! Hãy chạy: docker-compose up -d rabbitmq"
fi
print_success "RabbitMQ đang chạy"

print_info "Kiểm tra Backend..."
if ! docker ps | grep -q "code-grader-project-backend-1"; then
    print_error_and_exit "Backend không chạy! Hãy chạy: docker-compose up -d backend"
fi
print_success "Backend đang chạy"

print_info "Kiểm tra Docker image 'cpp-grader-env'..."
if ! docker images | grep -q "cpp-grader-env"; then
    print_error_and_exit "Docker image 'cpp-grader-env' không tồn tại! Hãy build: docker build -t cpp-grader-env ./grader-engine"
fi
print_success "Image 'cpp-grader-env' sẵn sàng"

# Kiểm tra virtual environment
cd grader-engine
if [ ! -d "venv" ]; then
    print_info "Tạo virtual environment..."
    python -m venv venv
    # Kiểm tra hệ điều hành để kích hoạt venv đúng cách
    if [ -f "venv/Scripts/activate" ]; then
        source venv/Scripts/activate  # Windows
    else
        source venv/bin/activate      # Linux/macOS
    fi
    pip install -q -r requirements.txt
    print_success "Virtual environment đã được tạo"
else
    # Kiểm tra hệ điều hành để kích hoạt venv đúng cách
    if [ -f "venv/Scripts/activate" ]; then
        source venv/Scripts/activate  # Windows
    else
        source venv/bin/activate      # Linux/macOS
    fi
    print_success "Virtual environment đã kích hoạt"
fi

# Hiển thị thông tin
echo
echo -e "${BGreen}=======================================================================${Color_Off}"
echo -e "${BGreen}==                  WORKER ĐANG KHỞI ĐỘNG                         ==${Color_Off}"
echo -e "${BGreen}=======================================================================${Color_Off}"
echo
echo -e "Database:     ${BYellow}$DATABASE_URL${Color_Off}"
echo -e "RabbitMQ:     ${BYellow}$RABBITMQ_HOST:5672${Color_Off}"
echo -e "Backend API:  ${BYellow}$BACKEND_API_URL${Color_Off}"
echo -e "Temp Dir:     ${BYellow}$GRADER_TEMP_DIR${Color_Off}"
echo
echo -e "${BRed}Nhấn Ctrl+C để dừng worker${Color_Off}"
echo "-----------------------------------------------------------------------"
echo

# Chạy worker
python run.py