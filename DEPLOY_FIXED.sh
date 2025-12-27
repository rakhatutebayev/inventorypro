#!/bin/bash
# Исправленный скрипт деплоя для выполнения на сервере

ssh root@ams.it-uae.com << 'EOF'
cd /var/www/inventorypro

# Обновить код
git pull

# Пересобрать frontend
docker-compose -f docker-compose.prod.yml build frontend

# Перезапустить
docker-compose -f docker-compose.prod.yml up -d

# Применить миграции
sleep 30
docker-compose -f docker-compose.prod.yml exec -T backend alembic upgrade head

# Создать данные
docker-compose -f docker-compose.prod.yml exec -T backend python << 'PYEOF'
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
    print(f'Error: {e}')
PYEOF

docker-compose -f docker-compose.prod.yml ps
echo "✅ Деплой завершен! http://ams.it-uae.com"
EOF

