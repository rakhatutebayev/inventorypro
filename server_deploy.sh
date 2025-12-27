#!/bin/bash
# Скрипт для выполнения на сервере ams.it-uae.com
# Скопируйте этот скрипт на сервер и выполните: bash server_deploy.sh

set -e

echo "🚀 Деплой InventoryPro на сервер"
echo "================================"
echo ""

# 1. Очистка
echo "1️⃣  Остановка старых контейнеров..."
docker ps -aq | xargs -r docker stop 2>/dev/null || true
docker ps -aq | xargs -r docker rm 2>/dev/null || true

echo "2️⃣  Очистка volumes..."
docker volume prune -f 2>/dev/null || true

echo "3️⃣  Удаление старой директории..."
rm -rf /var/www/inventorypro
rm -rf /root/inventorypro

# 2. Установка зависимостей
echo ""
echo "4️⃣  Проверка зависимостей..."
command -v git >/dev/null 2>&1 || (apt-get update -qq && apt-get install -y git -qq)
command -v docker >/dev/null 2>&1 || (curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh)

# 3. Клонирование
echo ""
echo "5️⃣  Клонирование репозитория..."
mkdir -p /var/www
cd /var/www
git clone https://github.com/rakhatu/inventorypro.git 2>&1 || (cd inventorypro && git pull)
cd inventorypro

# 4. Создание .env
echo ""
echo "6️⃣  Создание .env файла..."
cat > .env << EOF
POSTGRES_PASSWORD=$(openssl rand -hex 16)
SECRET_KEY=$(openssl rand -hex 32)
DEBUG=False
EOF

# 5. Запуск
echo ""
echo "7️⃣  Запуск Docker Compose..."
docker-compose -f docker-compose.prod.yml up -d --build

echo ""
echo "⏳ Ожидание запуска сервисов (50 секунд)..."
sleep 50

# 6. Миграции
echo ""
echo "8️⃣  Применение миграций..."
docker-compose -f docker-compose.prod.yml exec -T backend alembic upgrade head

# 7. Начальные данные
echo ""
echo "9️⃣  Создание начальных данных..."
docker-compose -f docker-compose.prod.yml exec -T backend python -c "
from app.database import SessionLocal
from app.models.user import User, UserRole
from app.models.company import Company
from app.models.device_type import DeviceType
from app.models.warehouse import Warehouse
from app.models.employee import Employee
from app.core.security import get_password_hash

db = SessionLocal()
try:
    if not db.query(User).filter(User.username == 'admin').first():
        db.add(User(username='admin', email='admin@example.com', hashed_password=get_password_hash('admin123'), role=UserRole.admin))
        print('✅ Admin created')
    if not db.query(Company).filter(Company.code == 'WWP').first():
        db.add(Company(code='WWP', name='World Wide Products'))
        print('✅ Company created')
    for code, name in [('01', 'Monitor'), ('02', 'Laptop'), ('03', 'Phone')]:
        if not db.query(DeviceType).filter(DeviceType.code == code).first():
            db.add(DeviceType(code=code, name=name))
            print(f'✅ Device type {code} created')
    if not db.query(Warehouse).filter(Warehouse.name == 'Main Warehouse').first():
        db.add(Warehouse(name='Main Warehouse', address='123 Main St'))
        print('✅ Warehouse created')
    if not db.query(Employee).filter(Employee.phone == '001').first():
        db.add(Employee(name='John Doe', phone='001', position='Manager'))
        print('✅ Employee created')
    db.commit()
    print('✅ All initial data created')
except Exception as e:
    db.rollback()
    print(f'⚠️  Error: {e}')
"

# 8. Проверка
echo ""
echo "🔟 Проверка статуса..."
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "✅ Деплой завершен!"
echo ""
echo "🌐 Приложение доступно: http://ams.it-uae.com"
echo "🔐 Логин: admin / admin123"

