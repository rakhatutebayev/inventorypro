#!/bin/bash

# Скрипт для деплоя на сервер

SERVER="root@ams.it-uae.com"
PROJECT_DIR="/var/www/inventorypro"

echo "🚀 Деплой InventoryPro на $SERVER"
echo "================================"
echo ""

# Проверка подключения
echo "1️⃣  Проверка подключения к серверу..."
ssh $SERVER "echo '✅ Подключение успешно'" || {
    echo "❌ Не удалось подключиться к серверу"
    exit 1
}

# Остановка и удаление старых контейнеров
echo ""
echo "2️⃣  Остановка старых контейнеров..."
ssh $SERVER "cd $PROJECT_DIR 2>/dev/null && docker-compose -f docker-compose.prod.yml down -v 2>/dev/null || docker-compose down -v 2>/dev/null || echo 'Нет запущенных контейнеров'"

# Удаление старой директории
echo ""
echo "3️⃣  Удаление старой директории проекта..."
ssh $SERVER "rm -rf $PROJECT_DIR"

# Создание директории
echo ""
echo "4️⃣  Создание директории проекта..."
ssh $SERVER "mkdir -p $PROJECT_DIR"

# Копирование файлов
echo ""
echo "5️⃣  Копирование файлов на сервер..."
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude '__pycache__' \
    --exclude '*.pyc' --exclude '.env' --exclude 'dist' --exclude 'build' \
    ./ $SERVER:$PROJECT_DIR/

# Создание .env файла
echo ""
echo "6️⃣  Создание .env файла..."
ssh $SERVER "cat > $PROJECT_DIR/.env << EOF
POSTGRES_PASSWORD=\${POSTGRES_PASSWORD:-inventorypro123}
SECRET_KEY=\${SECRET_KEY:-change-this-in-production-$(date +%s | sha256sum | base64 | head -c 32)}
DEBUG=False
EOF"

# Запуск проекта
echo ""
echo "7️⃣  Запуск проекта..."
ssh $SERVER "cd $PROJECT_DIR && docker-compose -f docker-compose.prod.yml up -d --build"

# Ожидание запуска
echo ""
echo "8️⃣  Ожидание запуска сервисов..."
sleep 30

# Применение миграций
echo ""
echo "9️⃣  Применение миграций..."
ssh $SERVER "cd $PROJECT_DIR && docker-compose -f docker-compose.prod.yml exec -T backend alembic upgrade head"

# Создание администратора
echo ""
echo "🔟 Создание администратора..."
ssh $SERVER "cd $PROJECT_DIR && docker-compose -f docker-compose.prod.yml exec -T backend python -c \"
from app.database import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash

db = SessionLocal()
try:
    if not db.query(User).filter(User.username == 'admin').first():
        admin = User(
            username='admin',
            email='admin@example.com',
            hashed_password=get_password_hash('admin123'),
            role=UserRole.admin
        )
        db.add(admin)
        db.commit()
        print('✅ Admin user created')
    else:
        print('ℹ️  Admin user already exists')
except Exception as e:
    print(f'❌ Error: {e}')
    db.rollback()
\""

echo ""
echo "✅ Деплой завершен!"
echo ""
echo "🌐 Приложение доступно по адресу: http://ams.it-uae.com"
echo "🔐 Логин: admin / admin123"
echo ""
echo "📱 Для мобильного приложения используйте:"
echo "   Host: ams.it-uae.com"
echo "   Port: 80"

