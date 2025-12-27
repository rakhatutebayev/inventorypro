# Troubleshooting Guide

## Frontend не работает (localhost:3000)

### Вариант 1: Запуск без Docker (если backend работает локально)

1. **Установите зависимости** (если еще не установлены):
```bash
cd frontend
npm install
```

2. **Запустите frontend**:
```bash
npm run dev
```

Или используйте скрипт:
```bash
./start-frontend.sh
```

### Вариант 2: Проверка через Docker

1. **Проверьте статус контейнеров**:
```bash
docker-compose ps
```

2. **Посмотрите логи frontend**:
```bash
docker-compose logs frontend
```

3. **Перезапустите frontend**:
```bash
docker-compose restart frontend
```

4. **Пересоберите и запустите заново**:
```bash
docker-compose down
docker-compose up -d --build
```

## Backend не работает (localhost:8000)

1. **Проверьте статус**:
```bash
docker-compose ps backend
docker-compose logs backend
```

2. **Проверьте подключение к базе данных**:
```bash
docker-compose logs postgres
```

3. **Перезапустите backend**:
```bash
docker-compose restart backend
```

## База данных не работает

1. **Проверьте статус PostgreSQL**:
```bash
docker-compose ps postgres
docker-compose logs postgres
```

2. **Проверьте переменные окружения**:
Убедитесь, что `backend/.env` файл существует и содержит правильные настройки.

## Общие проблемы

### Порты уже заняты

Если порты 3000, 8000 или 5432 заняты другими приложениями:

1. Найдите процесс, использующий порт:
```bash
# macOS/Linux
lsof -i :3000
lsof -i :8000
lsof -i :5432
```

2. Остановите процесс или измените порты в `docker-compose.yml`

### Проблемы с зависимостями

**Backend:**
```bash
docker-compose exec backend pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Проблемы с миграциями

Если база данных не создана:
```bash
docker-compose exec backend alembic revision --autogenerate -m "Initial migration"
docker-compose exec backend alembic upgrade head
```

### Очистка и перезапуск

Полная очистка и перезапуск:
```bash
# Остановить и удалить контейнеры
docker-compose down

# Удалить volumes (⚠️ удалит данные БД)
docker-compose down -v

# Пересобрать и запустить
docker-compose up -d --build
```

## Локальная разработка (без Docker)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

**Важно:** При локальной разработке:
- Backend будет на `http://localhost:8000`
- Frontend будет на `http://localhost:3000` (или другом порту, который покажет Vite)
- В `frontend/.env` установите `VITE_API_URL=http://localhost:8000/api/v1`


