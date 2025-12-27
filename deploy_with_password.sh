#!/bin/bash

# Скрипт для деплоя с использованием sshpass
# Установите sshpass: brew install hudochenkov/sshpass/sshpass (macOS)

SERVER="root@ams.it-uae.com"
PASSWORD="hVjrf8Ux"
PROJECT_DIR="/var/www/inventorypro"

# Проверка sshpass
if ! command -v sshpass &> /dev/null; then
    echo "❌ sshpass не установлен"
    echo "Установите: brew install hudochenkov/sshpass/sshpass"
    exit 1
fi

echo "🚀 Деплой на сервер..."

sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER bash << 'REMOTE_SCRIPT'
set -e

PROJECT_DIR="/var/www/inventorypro"

echo "1️⃣  Очистка..."
docker ps -aq | xargs -r docker stop 2>/dev/null || true
docker ps -aq | xargs -r docker rm 2>/dev/null || true
docker volume prune -f 2>/dev/null || true
rm -rf $PROJECT_DIR

echo "2️⃣  Установка Git..."
command -v git >/dev/null 2>&1 || (apt-get update -qq && apt-get install -y git -qq)

echo "3️⃣  Клонирование..."
mkdir -p /var/www
cd /var/www
git clone https://github.com/rakhatu/inventorypro.git $PROJECT_DIR 2>&1 || (cd $PROJECT_DIR && git pull)
cd $PROJECT_DIR

echo "4️⃣  Создание .env..."
cat > .env << EOF
POSTGRES_PASSWORD=$(openssl rand -hex 16)
SECRET_KEY=$(openssl rand -hex 32)
DEBUG=False
EOF

echo "5️⃣  Запуск Docker Compose..."
docker-compose -f docker-compose.prod.yml up -d --build

echo "⏳ Ожидание (50 секунд)..."
sleep 50

echo "6️⃣  Миграции..."
docker-compose -f docker-compose.prod.yml exec -T backend alembic upgrade head

echo "7️⃣  Начальные данные..."
docker-compose -f docker-compose.prod.yml exec -T backend python << 'PYTHON_SCRIPT'
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
    print('✅ All done')
except Exception as e:
    db.rollback()
    print(f'⚠️  Error: {e}')
PYTHON_SCRIPT

echo "8️⃣  Проверка статуса..."
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "✅ Деплой завершен!"
echo "🌐 http://ams.it-uae.com"
echo "🔐 admin / admin123"
REMOTE_SCRIPT

echo ""
echo "✅ Готово!"

