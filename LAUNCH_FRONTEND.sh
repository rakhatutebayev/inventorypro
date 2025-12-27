#!/bin/bash

echo "🚀 Запуск Frontend для InventoryPro"
echo ""

cd "$(dirname "$0")/frontend"

echo "📦 Проверка зависимостей..."
if [ ! -d "node_modules" ]; then
    echo "Установка npm пакетов..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Ошибка при установке зависимостей"
        exit 1
    fi
else
    echo "✅ Зависимости уже установлены"
fi

echo ""
echo "🌐 Запуск frontend сервера..."
echo "После запуска откройте: http://localhost:3000"
echo "Логин: admin, Пароль: admin123"
echo ""
echo "Для остановки нажмите Ctrl+C"
echo ""

npm run dev


