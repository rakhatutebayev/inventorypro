# 🐳 Запуск InventoryPro через Docker

## Шаг 1: Запустите Docker Desktop

**ВАЖНО:** Убедитесь, что Docker Desktop запущен перед выполнением команд!

Проверить можно командой:
```bash
docker info
```

Если выводит информацию о Docker - всё ок. Если ошибку - запустите Docker Desktop.

## Шаг 2: Остановите локальные сервисы (если запущены)

Если у вас сейчас работают backend или PostgreSQL локально, остановите их:

```bash
# Найти процессы Python (backend)
ps aux | grep uvicorn
# Остановить процесс (замените PID на реальный)
kill <PID>

# PostgreSQL обычно не нужно останавливать, Docker использует свой контейнер
```

## Шаг 3: Запуск через Docker Compose

```bash
cd /Users/rakhat/Documents/webhosting/InventoryPro

# Запустить все сервисы
docker-compose up -d --build

# Проверить статус
docker-compose ps

# Посмотреть логи
docker-compose logs -f
```

## Шаг 4: Создание миграций и начальных данных

```bash
# Создать миграцию БД
docker-compose exec backend alembic revision --autogenerate -m "Initial migration"
docker-compose exec backend alembic upgrade head

# Создать тестового администратора и начальные данные
docker-compose exec backend python -c "
from app.database import SessionLocal
from app.models.user import User, UserRole
from app.models.company import Company
from app.models.device_type import DeviceType
from app.models.warehouse import Warehouse
from app.models.employee import Employee
from app.core.security import get_password_hash

db = SessionLocal()

# Admin user
admin = User(username='admin', email='admin@example.com', hashed_password=get_password_hash('admin123'), role=UserRole.admin)
db.add(admin)

# Company
company = Company(code='WWP', name='World Wide Products')
db.add(company)

# Device types
for code, name in [('01', 'Monitor'), ('02', 'Laptop'), ('03', 'Phone')]:
    db.add(DeviceType(code=code, name=name))

# Warehouse
db.add(Warehouse(name='Main Warehouse', address='123 Main St'))

# Employee
db.add(Employee(name='John Doe', phone='001', position='Manager'))

db.commit()
print('✅ Initial data created!')
"
```

## Шаг 5: Проверка работы

После запуска проверьте:

1. **Backend**: http://localhost:8000/health
   - Должен вернуть: `{"status":"ok"}`

2. **Frontend**: http://localhost:3000
   - Должен открыться интерфейс логина

3. **API Docs**: http://localhost:8000/docs

## Доступ к приложению

- **URL**: http://localhost:3000
- **Логин**: `admin`
- **Пароль**: `admin123`

## Управление контейнерами

```bash
# Остановить все сервисы
docker-compose stop

# Запустить снова
docker-compose start

# Остановить и удалить контейнеры
docker-compose down

# Остановить и удалить контейнеры + volumes (⚠️ удалит данные БД)
docker-compose down -v

# Посмотреть логи
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

## Production Deployment

Для production используйте тот же docker-compose.yml, но:

1. Создайте `.env` файл с production настройками:
   - `SECRET_KEY` - длинный случайный ключ
   - `DEBUG=False`
   - `DATABASE_URL` - production database URL
   - `CORS_ORIGINS` - список разрешенных доменов

2. Для production frontend лучше собрать статику:
   ```bash
   cd frontend
   npm run build
   ```
   Затем настроить nginx для раздачи статики или использовать production-версию Dockerfile


