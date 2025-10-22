#!/bin/bash

# 🚀 Quick start script for Go worker

set -e

echo "🚀 Starting Go Grader Worker..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found, copying from .env.example"
    cp .env.example .env
    echo "✅ Created .env file"
    echo ""
    echo "🔧 Please edit .env with your configuration:"
    echo "   - RABBITMQ_HOST"
    echo "   - DATABASE_URL"
    echo "   - BACKEND_API_URL"
    echo ""
    exit 1
fi

# Build if binary doesn't exist
if [ ! -f ./worker ]; then
    echo "🔨 Building worker..."
    go build -o worker .
    echo "✅ Build complete"
    echo ""
fi

# Load environment
export $(cat .env | grep -v '^#' | xargs)

echo "📋 Configuration:"
echo "   RabbitMQ:  $RABBITMQ_HOST"
echo "   Database:  $DATABASE_URL"
echo "   Backend:   $BACKEND_API_URL"
echo "   Pool Size: $CONTAINER_POOL_SIZE"
echo ""

# Run worker
echo "🎯 Starting worker..."
echo "   Press Ctrl+C to stop"
echo ""

./worker
