# Простой деплой - скопируйте и выполните

## Вариант 1: Через скрипт (если установлен sshpass)

```bash
# Установить sshpass (если нет)
brew install hudochenkov/sshpass/sshpass

# Запустить деплой
./deploy_with_password.sh
```

## Вариант 2: Вручную (проще всего)

### Шаг 1: GitHub
```bash
cd /Users/rakhat/Documents/webhosting/InventoryPro

# Создайте репозиторий на https://github.com/new (название: inventorypro)

git push -u origin main
# Используйте Personal Access Token вместо пароля
```

### Шаг 2: Сервер (выполните эти команды на сервере)

```bash
# Подключитесь: ssh root@ams.it-uae.com (пароль: hVjrf8Ux)

cd /var/www
rm -rf inventorypro
git clone https://github.com/rakhatu/inventorypro.git
cd inventorypro

cat > .env << 'ENVEOF'
POSTGRES_PASSWORD=$(openssl rand -hex 16)
SECRET_KEY=$(openssl rand -hex 32)
DEBUG=False
ENVEOF

docker-compose -f docker-compose.prod.yml up -d --build
sleep 50
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
docker-compose -f docker-compose.prod.yml exec backend python -c "from app.database import SessionLocal; from app.models.user import User, UserRole; from app.models.company import Company; from app.models.device_type import DeviceType; from app.models.warehouse import Warehouse; from app.models.employee import Employee; from app.core.security import get_password_hash; db = SessionLocal(); db.add(User(username='admin', email='admin@example.com', hashed_password=get_password_hash('admin123'), role=UserRole.admin)) if not db.query(User).filter(User.username == 'admin').first() else None; db.add(Company(code='WWP', name='World Wide Products')) if not db.query(Company).filter(Company.code == 'WWP').first() else None; [db.add(DeviceType(code=c, name=n)) for c, n in [('01', 'Monitor'), ('02', 'Laptop'), ('03', 'Phone')] if not db.query(DeviceType).filter(DeviceType.code == c).first()]; db.add(Warehouse(name='Main Warehouse', address='123 Main St')) if not db.query(Warehouse).filter(Warehouse.name == 'Main Warehouse').first() else None; db.add(Employee(name='John Doe', phone='001', position='Manager')) if not db.query(Employee).filter(Employee.phone == '001').first() else None; db.commit(); print('✅ Done')"
```

Готово! Откройте http://ams.it-uae.com
