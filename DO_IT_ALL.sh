#!/bin/bash

# Скопируйте весь этот скрипт в терминал на сервере и выполните
# Или подключитесь: ssh root@ams.it-uae.com и выполните команды ниже

cat << 'DEPLOY_COMMANDS'
#!/bin/bash
set -e

cd /var/www
rm -rf inventorypro
git clone https://github.com/rakhatu/inventorypro.git
cd inventorypro

cat > .env << EOF
POSTGRES_PASSWORD=$(openssl rand -hex 16)
SECRET_KEY=$(openssl rand -hex 32)
DEBUG=False
EOF

docker-compose -f docker-compose.prod.yml up -d --build
sleep 50
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
docker-compose -f docker-compose.prod.yml exec backend python << 'PYEOF'
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
    if not db.query(Company).filter(Company.code == 'WWP').first():
        db.add(Company(code='WWP', name='World Wide Products'))
    for code, name in [('01', 'Monitor'), ('02', 'Laptop'), ('03', 'Phone')]:
        if not db.query(DeviceType).filter(DeviceType.code == code).first():
            db.add(DeviceType(code=code, name=name))
    if not db.query(Warehouse).filter(Warehouse.name == 'Main Warehouse').first():
        db.add(Warehouse(name='Main Warehouse', address='123 Main St'))
    if not db.query(Employee).filter(Employee.phone == '001').first():
        db.add(Employee(name='John Doe', phone='001', position='Manager'))
    db.commit()
    print('✅ Done')
except Exception as e:
    db.rollback()
    print(f'Error: {e}')
PYEOF

echo "✅ Готово! http://ams.it-uae.com (admin/admin123)"
DEPLOY_COMMANDS

echo ""
echo "📋 Скопируйте команды выше и выполните их на сервере:"
echo "   ssh root@ams.it-uae.com"
echo "   (пароль: hVjrf8Ux)"

