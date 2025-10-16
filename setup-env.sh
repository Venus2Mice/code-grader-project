#!/bin/bash

# Script to setup environment for different scenarios

show_help() {
    echo "Usage: ./setup-env.sh [MODE]"
    echo ""
    echo "Modes:"
    echo "  local       - Local development (Frontend & Backend separate)"
    echo "  docker      - Docker Compose (All in containers)"
    echo "  codespaces  - GitHub Codespaces"
    echo "  help        - Show this help"
    echo ""
    echo "Examples:"
    echo "  ./setup-env.sh local"
    echo "  ./setup-env.sh docker"
}

setup_local() {
    echo "🔧 Setting up for LOCAL development..."
    cp frontend-new/.env.local frontend-new/.env.local.backup 2>/dev/null
    echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > frontend-new/.env.local
    echo "✅ Frontend will connect to: http://localhost:5000"
    echo ""
    echo "To run:"
    echo "  Terminal 1: cd backend && docker-compose up postgres rabbitmq"
    echo "  Terminal 2: cd backend && source venv/bin/activate && flask run"
    echo "  Terminal 3: cd frontend-new && pnpm dev"
}

setup_docker() {
    echo "🐳 Setting up for DOCKER COMPOSE..."
    cp frontend-new/.env.local frontend-new/.env.local.backup 2>/dev/null
    echo "NEXT_PUBLIC_API_URL=http://backend:5000" > frontend-new/.env.local
    echo "✅ Frontend will connect to: http://backend:5000 (Docker network)"
    echo ""
    echo "To run:"
    echo "  docker-compose up -d"
    echo "  Access: http://localhost:3000"
}

setup_codespaces() {
    echo "☁️  Setting up for CODESPACES..."
    cp frontend-new/.env.local frontend-new/.env.local.backup 2>/dev/null
    echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > frontend-new/.env.local
    echo "✅ Frontend will connect to: http://localhost:5000 (Forwarded port)"
    echo ""
    echo "To run:"
    echo "  Terminal 1: docker-compose up -d backend postgres rabbitmq"
    echo "  Terminal 2: cd frontend-new && pnpm dev"
}

# Main script
case "$1" in
    local)
        setup_local
        ;;
    docker)
        setup_docker
        ;;
    codespaces)
        setup_codespaces
        ;;
    help|--help|-h|"")
        show_help
        ;;
    *)
        echo "❌ Unknown mode: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
