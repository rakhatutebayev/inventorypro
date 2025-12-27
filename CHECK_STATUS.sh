#!/bin/bash

echo "🔍 Проверка статуса InventoryPro..."
echo ""

echo "📊 Проверка портов:"
echo "  Port 3000 (Frontend):"
lsof -i :3000 2>/dev/null && echo "    ✅ Занят" || echo "    ❌ Свободен"
echo "  Port 8000 (Backend):"
lsof -i :8000 2>/dev/null && echo "    ✅ Занят" || echo "    ❌ Свободен"
echo "  Port 5432 (PostgreSQL):"
lsof -i :5432 2>/dev/null && echo "    ✅ Занят" || echo "    ❌ Свободен"
echo ""

echo "🐳 Проверка Docker:"
if docker info >/dev/null 2>&1; then
    echo "  ✅ Docker daemon запущен"
    echo ""
    echo "📦 Docker контейнеры:"
    docker-compose ps 2>/dev/null || docker ps -a | grep inventorypro || echo "    Контейнеры не найдены"
else
    echo "  ❌ Docker daemon НЕ запущен"
    echo "  💡 Запустите Docker Desktop"
fi
echo ""

echo "🌐 Проверка сервисов:"
echo "  Backend (http://localhost:8000/health):"
curl -s http://localhost:8000/health 2>/dev/null && echo " ✅ Работает" || echo " ❌ Не работает"
echo ""
echo "  Frontend (http://localhost:3000):"
curl -s http://localhost:3000 >/dev/null 2>&1 && echo " ✅ Работает" || echo " ❌ Не работает"
echo ""

echo "📁 Проверка зависимостей:"
if [ -d "frontend/node_modules" ]; then
    echo "  ✅ frontend/node_modules существует"
else
    echo "  ❌ frontend/node_modules не найден"
    echo "  💡 Запустите: cd frontend && npm install"
fi


