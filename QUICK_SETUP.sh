#!/bin/bash

echo "🚀 Быстрая настройка InventoryPro"
echo ""

cd "$(dirname "$0")"

# Проверка Docker
if ! docker ps >/dev/null 2>&1; then
    echo "❌ Docker не запущен! Запустите Docker Desktop"
    exit 1
fi

echo "✅ Docker работает"
echo ""

# Проверка и освобождение порта 3000
if lsof -ti :3000 >/dev/null 2>&1; then
    echo "⚠️  Порт 3000 занят, освобождаем..."
    lsof -ti :3000 | xargs kill -9 2>/dev/null
    sleep 2
fi

# Запуск контейнеров
echo "📦 Запуск контейнеров..."
docker-compose up -d

echo ""
echo "⏳ Ожидание запуска (30 секунд)..."
sleep 30

# Проверка статуса
echo ""
echo "📊 Статус контейнеров:"
docker-compose ps

# Создание миграций
echo ""
echo "🗄️  Создание миграций БД..."
docker-compose exec -T backend alembic revision --autogenerate -m "Initial migration" 2>/dev/null || echo "Миграция может уже существовать"
docker-compose exec -T backend alembic upgrade head

# Создание начальных данных
echo ""
echo "👤 Создание тестового администратора и данных..."
docker-compose exec -T backend python -c "
from app.database import SessionLocal
from app.models.user import User, UserRole
from app.models.company import Company
from app.models.device_type import DeviceType
from app.models.warehouse import Warehouse
from app.models.employee import Employee
from app.core.security import get_password_hash

db = SessionLocal()

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
print('✅ Setup completed!')
"

echo ""
echo "✅ Настройка завершена!"
echo ""
echo "🌐 Доступ:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "🔐 Логин: admin / admin123"


