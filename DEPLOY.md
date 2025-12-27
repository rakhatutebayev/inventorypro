# Деплой InventoryPro на ams.it-uae.com

## Предварительные требования

1. Сервер с Docker и Docker Compose
2. Доступ по SSH к серверу
3. Git установлен на сервере

## Шаги деплоя

### 1. Подключение к серверу

```bash
ssh root@ams.it-uae.com
```

### 2. Очистка старого проекта

```bash
# Остановить и удалить старые контейнеры
docker-compose -f /path/to/old/project/docker-compose.yml down -v

# Удалить старую базу данных (если нужно)
docker volume rm old_project_postgres_data

# Удалить старую директорию проекта (если нужно)
rm -rf /path/to/old/project
```

### 3. Клонирование проекта

```bash
cd /var/www  # или другая директория
git clone https://github.com/rakhatu/inventorypro.git
cd inventorypro
```

### 4. Настройка переменных окружения

```bash
# Создать .env файл
cat > .env << EOF
POSTGRES_PASSWORD=your_secure_password_here
SECRET_KEY=your_secret_key_here
DEBUG=False
EOF
```

### 5. Запуск проекта

```bash
# Запустить в production режиме
docker-compose -f docker-compose.prod.yml up -d --build

# Применить миграции
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head

# Создать администратора (опционально)
docker-compose -f docker-compose.prod.yml exec backend python -c "
from app.database import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash

db = SessionLocal()
if not db.query(User).filter(User.username == 'admin').first():
    admin = User(
        username='admin',
        email='admin@example.com',
        hashed_password=get_password_hash('admin123'),
        role=UserRole.admin
    )
    db.add(admin)
    db.commit()
    print('Admin user created')
"
```

### 6. Проверка работы

```bash
# Проверить статус контейнеров
docker-compose -f docker-compose.prod.yml ps

# Проверить логи
docker-compose -f docker-compose.prod.yml logs -f
```

### 7. Настройка мобильного приложения

В настройках мобильного приложения укажите:
- Host: `ams.it-uae.com`
- Port: `80` (или `443` если настроен SSL)

## Обновление проекта

```bash
cd /var/www/inventorypro
git pull
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

