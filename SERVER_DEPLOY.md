# Деплой на сервер ams.it-uae.com

## Подключение к серверу

```bash
ssh root@ams.it-uae.com
# Password: hVjrf8Ux
```

## Шаг 1: Очистка старого проекта

```bash
# Найти старые контейнеры
docker ps -a | grep -i inventory

# Остановить и удалить старые контейнеры (замените на актуальные имена)
docker stop <container_name>
docker rm <container_name>

# Удалить старые volumes
docker volume ls | grep inventory
docker volume rm <volume_name>

# Удалить старую директорию проекта (если нужно)
rm -rf /var/www/inventorypro
# или
rm -rf /root/inventorypro
```

## Шаг 2: Установка зависимостей (если нужно)

```bash
# Проверить наличие Docker
docker --version
docker-compose --version

# Если нет Docker:
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Если нет Docker Compose:
apt-get update
apt-get install docker-compose-plugin
```

## Шаг 3: Клонирование проекта

```bash
# Создать директорию
mkdir -p /var/www
cd /var/www

# Клонировать репозиторий
git clone https://github.com/rakhatu/inventorypro.git
cd inventorypro

# Или если нет Git на сервере, используйте deploy.sh скрипт с локального компьютера
```

## Шаг 4: Настройка .env файла

```bash
cd /var/www/inventorypro

# Создать .env файл
cat > .env << EOF
POSTGRES_PASSWORD=inventorypro_secure_password_123
SECRET_KEY=$(openssl rand -hex 32)
DEBUG=False
EOF
```

## Шаг 5: Запуск проекта

```bash
cd /var/www/inventorypro

# Запустить в production режиме
docker-compose -f docker-compose.prod.yml up -d --build

# Подождать 30-40 секунд для запуска
sleep 40

# Проверить статус
docker-compose -f docker-compose.prod.yml ps
```

## Шаг 6: Применение миграций

```bash
cd /var/www/inventorypro

# Применить миграции
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

## Шаг 7: Создание администратора

```bash
cd /var/www/inventorypro

docker-compose -f docker-compose.prod.yml exec backend python -c "
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
        admin = User(
            username='admin',
            email='admin@example.com',
            hashed_password=get_password_hash('admin123'),
            role=UserRole.admin
        )
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
    import traceback
    traceback.print_exc()
"
```

## Шаг 8: Проверка работы

```bash
# Проверить логи
docker-compose -f docker-compose.prod.yml logs --tail=50

# Проверить доступность
curl http://localhost/health
curl http://localhost/api/v1/health

# Проверить извне
curl http://ams.it-uae.com/health
```

## Обновление проекта

```bash
cd /var/www/inventorypro
git pull
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

## Настройка мобильного приложения

В настройках мобильного приложения укажите:
- **Host**: `ams.it-uae.com`
- **Port**: `80`

