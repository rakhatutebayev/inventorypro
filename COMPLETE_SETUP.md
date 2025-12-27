# ✅ Инструкция по завершению настройки

## Текущий статус:

Backend и PostgreSQL запущены и работают. Осталось только:
1. Запустить frontend (порт 3000 может быть занят)
2. Создать миграции БД
3. Создать начальные данные

## Шаги для завершения:

### 1. Проверьте, что Docker запущен

```bash
docker ps
```

Если показывает контейнеры - Docker работает. Если ошибка - запустите Docker Desktop.

### 2. Проверьте статус контейнеров

```bash
cd /Users/rakhat/Documents/webhosting/InventoryPro
docker-compose ps
```

Должны быть запущены:
- ✅ inventorypro_postgres
- ✅ inventorypro_backend
- ⚠️ inventorypro_frontend (может быть не запущен)

### 3. Если frontend не запущен, освободите порт 3000 и запустите:

```bash
# Найти и остановить процесс на порту 3000
lsof -ti :3000 | xargs kill -9

# Запустить frontend
docker-compose up -d frontend
```

### 4. Создать миграции БД:

```bash
docker-compose exec backend alembic revision --autogenerate -m "Initial migration"
docker-compose exec backend alembic upgrade head
```

### 5. Создать тестового администратора и начальные данные:

```bash
docker-compose exec backend python -c "
from app.database import SessionLocal
from app.models.user import User, UserRole
from app.models.company import Company
from app.models.device_type import DeviceType
from app.models.warehouse import Warehouse
from app.models.employee import Employee
from app.core.security import get_password_hash

db = SessionLocal()

# Admin
if not db.query(User).filter(User.username == 'admin').first():
    db.add(User(username='admin', email='admin@example.com', hashed_password=get_password_hash('admin123'), role=UserRole.admin))
    print('✅ Admin created')

# Company
if not db.query(Company).filter(Company.code == 'WWP').first():
    db.add(Company(code='WWP', name='World Wide Products'))
    print('✅ Company created')

# Device types
for code, name in [('01', 'Monitor'), ('02', 'Laptop'), ('03', 'Phone')]:
    if not db.query(DeviceType).filter(DeviceType.code == code).first():
        db.add(DeviceType(code=code, name=name))
        print(f'✅ Device type {code} created')

# Warehouse
if not db.query(Warehouse).filter(Warehouse.name == 'Main Warehouse').first():
    db.add(Warehouse(name='Main Warehouse', address='123 Main St'))
    print('✅ Warehouse created')

# Employee
if not db.query(Employee).filter(Employee.phone == '001').first():
    db.add(Employee(name='John Doe', phone='001', position='Manager'))
    print('✅ Employee created')

db.commit()
print('✅ Setup completed!')
"
```

### 6. Проверьте работу:

- **Backend**: http://localhost:8000/health (должен вернуть `{"status":"ok"}`)
- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs

### 7. Войдите в систему:

- **URL**: http://localhost:3000
- **Логин**: `admin`
- **Пароль**: `admin123`

## Полезные команды:

```bash
# Посмотреть логи
docker-compose logs -f

# Остановить все
docker-compose stop

# Запустить снова
docker-compose start

# Перезапустить конкретный сервис
docker-compose restart backend
```

## Если что-то не работает:

1. Проверьте, что Docker Desktop запущен
2. Проверьте логи: `docker-compose logs`
3. Перезапустите контейнеры: `docker-compose restart`


