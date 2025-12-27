#!/bin/bash

set -e  # Остановка при ошибке

echo "🚀 Полная настройка InventoryPro через Docker"
echo "=============================================="
echo ""

cd "$(dirname "$0")"

# Проверка и ожидание Docker
echo "1️⃣  Проверка Docker..."
MAX_WAIT=90
WAITED=0
while ! docker ps >/dev/null 2>&1; do
    if [ $WAITED -ge $MAX_WAIT ]; then
        echo "❌ ОШИБКА: Docker daemon не запустился за $MAX_WAIT секунд!"
        echo "💡 Убедитесь, что Docker Desktop запущен и работает"
        exit 1
    fi
    if [ $WAITED -eq 0 ]; then
        echo "⏳ Ожидание запуска Docker daemon..."
        open -a Docker 2>/dev/null || true
    fi
    sleep 3
    WAITED=$((WAITED + 3))
    echo "   Ожидание... ($WAITED сек)"
done
echo "✅ Docker работает"
echo ""

# Освобождение портов
echo "2️⃣  Освобождение портов..."
# Останавливаем контейнеры, занимающие порты
docker ps --format "{{.Names}}\t{{.Ports}}" | grep ":3000" | awk '{print $1}' | xargs -r docker stop 2>/dev/null || true
docker ps --format "{{.Names}}\t{{.Ports}}" | grep ":5432" | awk '{print $1}' | xargs -r docker stop 2>/dev/null || true
# Убиваем процессы на портах
lsof -ti :3000 | xargs kill -9 2>/dev/null || true
lsof -ti :5432 | xargs kill -9 2>/dev/null || true
sleep 2
echo "✅ Порты освобождены"
echo ""

# Остановка старых контейнеров
echo "3️⃣  Остановка старых контейнеров..."
docker-compose down 2>/dev/null || true
echo "✅ Готово"
echo ""

# Запуск контейнеров
echo "4️⃣  Сборка и запуск контейнеров..."
docker-compose up -d --build
echo "✅ Контейнеры запущены"
echo ""

# Ожидание запуска
echo "5️⃣  Ожидание запуска сервисов (50 секунд)..."
sleep 50
echo "✅ Ожидание завершено"
echo ""

# Проверка статуса
echo "6️⃣  Проверка статуса контейнеров:"
docker-compose ps
echo ""

# Создание миграций
echo "7️⃣  Создание миграций БД..."
docker-compose exec -T backend alembic revision --autogenerate -m "Initial migration" 2>/dev/null || echo "Миграция уже существует или будет создана"
docker-compose exec -T backend alembic upgrade head
echo "✅ Миграции применены"
echo ""

# Создание начальных данных
echo "8️⃣  Создание тестового администратора и данных..."
docker-compose exec -T backend python -c "
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
        admin = User(username='admin', email='admin@example.com', hashed_password=get_password_hash('admin123'), role=UserRole.admin)
        db.add(admin)
        print('✅ Admin user created')
    
    if not db.query(Company).filter(Company.code == 'WWP').first():
        company = Company(code='WWP', name='World Wide Products')
        db.add(company)
        print('✅ Company WWP created')
    
    for code, name in [('01', 'Monitor'), ('02', 'Laptop'), ('03', 'Phone')]:
        if not db.query(DeviceType).filter(DeviceType.code == code).first():
            db.add(DeviceType(code=code, name=name))
            print(f'✅ Device type {code} ({name}) created')
    
    if not db.query(Warehouse).filter(Warehouse.name == 'Main Warehouse').first():
        warehouse = Warehouse(name='Main Warehouse', address='123 Main St')
        db.add(warehouse)
        print('✅ Warehouse created')
    
    if not db.query(Employee).filter(Employee.phone == '001').first():
        employee = Employee(name='John Doe', phone='001', position='Manager')
        db.add(employee)
        print('✅ Employee created')
    
    db.commit()
    print('✅ All initial data created successfully!')
except Exception as e:
    db.rollback()
    print(f'❌ Error: {e}')
    exit(1)
"
echo "✅ Данные созданы"
echo ""

# Финальная проверка
echo "9️⃣  Финальная проверка..."
sleep 5

BACKEND_STATUS=$(curl -s http://localhost:8000/health 2>/dev/null && echo "✅" || echo "❌")
FRONTEND_STATUS=$(curl -s http://localhost:3000 >/dev/null 2>&1 && echo "✅" || echo "⏳")

echo "Backend:  $BACKEND_STATUS"
echo "Frontend: $FRONTEND_STATUS"
echo ""

# Итоговый статус
echo "=============================================="
echo "🎉 НАСТРОЙКА ЗАВЕРШЕНА!"
echo "=============================================="
echo ""
echo "🌐 Доступ к приложению:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "🔐 Данные для входа:"
echo "   Логин:    admin"
echo "   Пароль:   admin123"
echo ""
echo "📋 Полезные команды:"
echo "   docker-compose ps          - статус контейнеров"
echo "   docker-compose logs -f     - логи в реальном времени"
echo "   docker-compose stop        - остановить все"
echo "   docker-compose start       - запустить все"
echo ""


