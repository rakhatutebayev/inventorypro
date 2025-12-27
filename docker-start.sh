#!/bin/bash

echo "🐳 Запуск InventoryPro через Docker"
echo ""

# Проверка Docker
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker daemon не запущен!"
    echo "💡 Запустите Docker Desktop и попробуйте снова"
    exit 1
fi

echo "✅ Docker daemon запущен"
echo ""

cd "$(dirname "$0")"

# Проверка .env файла
if [ ! -f backend/.env ]; then
    echo "📝 Создание .env файла..."
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
    echo "✅ .env файл создан"
fi

echo "🔨 Сборка и запуск контейнеров..."
docker-compose up -d --build

echo ""
echo "⏳ Ожидание запуска сервисов (30 секунд)..."
sleep 30

echo ""
echo "📊 Статус контейнеров:"
docker-compose ps

echo ""
echo "📝 Следующие шаги:"
echo ""
echo "1. Создайте миграции БД:"
echo "   docker-compose exec backend alembic revision --autogenerate -m 'Initial migration'"
echo "   docker-compose exec backend alembic upgrade head"
echo ""
echo "2. Создайте начальные данные (админ пользователь и справочники)"
echo "   См. инструкции в DOCKER_START.md"
echo ""
echo "🌐 После настройки доступ:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:8000"
echo "   - API Docs: http://localhost:8000/docs"
echo ""
echo "📋 Логи:"
echo "   docker-compose logs -f"


