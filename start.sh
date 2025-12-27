#!/bin/bash

# Start InventoryPro services with Docker Compose

echo "🚀 Starting InventoryPro services..."

# Check if .env file exists
if [ ! -f backend/.env ]; then
    echo "📝 Creating .env file from .env.example..."
    cat > backend/.env << EOF
# Database
DATABASE_URL=postgresql://inventorypro:inventorypro@postgres:5432/inventorypro

# Security
SECRET_KEY=change-this-in-production-use-long-random-string-12345
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Application
API_V1_PREFIX=/api/v1
PROJECT_NAME=InventoryPro
DEBUG=True

# CORS
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]
EOF
    echo "✅ .env file created"
fi

# Build and start services
echo "🔨 Building and starting containers..."
docker-compose up -d --build

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check if services are running
echo ""
echo "📊 Service status:"
docker-compose ps

echo ""
echo "✅ Services started!"
echo ""
echo "📝 Next steps:"
echo "1. Create database migration:"
echo "   docker-compose exec backend alembic revision --autogenerate -m 'Initial migration'"
echo "   docker-compose exec backend alembic upgrade head"
echo ""
echo "2. Create initial data (admin user, companies, etc.)"
echo "   See README.md for instructions"
echo ""
echo "🌐 Access points:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:8000"
echo "   - API Docs: http://localhost:8000/docs"
echo ""
echo "📋 View logs:"
echo "   docker-compose logs -f"


