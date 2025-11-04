#!/bin/bash

# Production Mode Helper Script
# Usage: ./prod.sh [start|stop|restart|logs|build]

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Docker compose file
COMPOSE_FILE="docker-compose.yml"

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_help() {
    cat << EOF
🚀 Production Mode Helper

Usage: ./prod.sh [command]

Commands:
  start       Start all services in production mode
  stop        Stop all services
  restart     Restart all services
  logs        Show logs from all services (follow mode)
  build       Rebuild all images
  status      Show status of all services
  clean       Stop and remove all containers, volumes, images

Examples:
  ./prod.sh start         # Start production mode
  ./prod.sh logs          # Watch logs
  ./prod.sh restart       # Restart all services

Services:
  Frontend:  http://localhost:3000 (Nginx optimized build)
  Backend:   http://localhost:5000 (Flask production)
  Worker:    http://localhost:8080 (Compiled Go binary)
  RabbitMQ:  http://localhost:15672 (guest/guest)

EOF
}

start_services() {
    print_status "Starting services in production mode..."
    
    # Check if .env exists
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from .env.example..."
        if [ -f .env.example ]; then
            cp .env.example .env
            print_status ".env file created. Please review and update if needed."
        else
            print_error ".env.example not found. Please create .env manually."
            exit 1
        fi
    fi
    
    # Start services
    docker-compose -f $COMPOSE_FILE up -d
    
    print_status "Services started successfully!"
    echo ""
    print_status "🚀 Production mode services:"
    echo "  ✅ Frontend (Nginx)      -> http://localhost:3000"
    echo "  ✅ Backend (Flask)       -> http://localhost:5000"
    echo "  ✅ Worker (Go compiled)  -> http://localhost:8080"
    echo "  📊 RabbitMQ Management   -> http://localhost:15672"
    echo ""
    print_status "View logs: ./prod.sh logs"
}

stop_services() {
    print_status "Stopping services..."
    docker-compose -f $COMPOSE_FILE down
    print_status "Services stopped."
}

restart_services() {
    print_status "Restarting services..."
    docker-compose -f $COMPOSE_FILE restart
    print_status "Services restarted."
}

show_logs() {
    print_status "Showing logs (press Ctrl+C to exit)..."
    docker-compose -f $COMPOSE_FILE logs -f
}

build_images() {
    print_status "Building images..."
    docker-compose -f $COMPOSE_FILE build --no-cache
    
    # Build sandbox image
    print_status "Building sandbox image..."
    docker build -t code-grader-project-sandbox:latest -f grader-engine-go/Dockerfile.sandbox grader-engine-go
    
    print_status "All images built successfully!"
}

show_status() {
    print_status "Service status:"
    docker-compose -f $COMPOSE_FILE ps
}

clean_all() {
    print_warning "This will stop and remove all containers, volumes, and images."
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Cleaning up..."
        docker-compose -f $COMPOSE_FILE down -v --rmi all
        print_status "Cleanup complete."
    else
        print_status "Cleanup cancelled."
    fi
}

# Main script
case "${1:-}" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    logs)
        show_logs
        ;;
    build)
        build_images
        ;;
    status)
        show_status
        ;;
    clean)
        clean_all
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
