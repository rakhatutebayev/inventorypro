#!/bin/bash

# Быстрый деплой на сервер
# Использование: ./QUICK_DEPLOY.sh

SERVER="root@ams.it-uae.com"
PROJECT_DIR="/var/www/inventorypro"

echo "🚀 Быстрый деплой InventoryPro"
echo "================================"
echo ""

# 1. Загрузка в GitHub (если нужно)
read -p "Загрузить код в GitHub? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📤 Загрузка в GitHub..."
    git add .
    git commit -m "Production deployment configuration" || true
    git push origin main || git push origin master || echo "⚠️  Push в GitHub пропущен"
fi

# 2. Подключение к серверу и деплой
echo ""
echo "📡 Подключение к серверу..."
ssh $SERVER bash << EOF
    set -e
    
    echo "1️⃣  Остановка старых контейнеров..."
    cd $PROJECT_DIR 2>/dev/null && docker-compose -f docker-compose.prod.yml down -v 2>/dev/null || docker-compose down -v 2>/dev/null || echo "Нет старых контейнеров"
    
    echo ""
    echo "2️⃣  Удаление старой директории..."
    rm -rf $PROJECT_DIR
    
    echo ""
    echo "3️⃣  Создание директории..."
    mkdir -p $PROJECT_DIR
    
    echo ""
    echo "4️⃣  Клонирование репозитория..."
    cd /var/www
    git clone https://github.com/rakhatu/inventorypro.git || (cd inventorypro && git pull)
    cd inventorypro
    
    echo ""
    echo "5️⃣  Создание .env файла..."
    cat > .env << ENVEOF
POSTGRES_PASSWORD=\${POSTGRES_PASSWORD:-inventorypro123}
SECRET_KEY=\${SECRET_KEY:-$(openssl rand -hex 32)}
DEBUG=False
ENVEOF
    
    echo ""
    echo "6️⃣  Запуск проекта..."
    docker-compose -f docker-compose.prod.yml up -d --build
    
    echo ""
    echo "7️⃣  Ожидание запуска (40 секунд)..."
    sleep 40
    
    echo ""
    echo "8️⃣  Применение миграций..."
    docker-compose -f docker-compose.prod.yml exec -T backend alembic upgrade head
    
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
        admin = User(username='admin', email='admin@example.com', hashed_password=get_password_hash('admin123'), role=UserRole.admin)
        db.add(admin)
        print('✅ Admin created')
    if not db.query(Company).filter(Company.code == 'WWP').first():
        db.add(Company(code='WWP', name='World Wide Products'))
        print('✅ Company created')
    for code, name in [('01', 'Monitor'), ('02', 'Laptop'), ('03', 'Phone')]:
        if not db.query(DeviceType).filter(DeviceType.code == code).first():
            db.add(DeviceType(code=code, name=name))
    if not db.query(Warehouse).filter(Warehouse.name == 'Main Warehouse').first():
        db.add(Warehouse(name='Main Warehouse', address='123 Main St'))
    if not db.query(Employee).filter(Employee.phone == '001').first():
        db.add(Employee(name='John Doe', phone='001', position='Manager'))
    db.commit()
    print('✅ Initial data created')
except Exception as e:
    db.rollback()
    print(f'⚠️  Error: {e}')
"
    
    echo ""
    echo "✅ Деплой завершен!"
    echo ""
    echo "🌐 Приложение: http://ams.it-uae.com"
    echo "🔐 Логин: admin / admin123"
EOF

echo ""
echo "🎉 Готово! Проект развернут на ams.it-uae.com"

