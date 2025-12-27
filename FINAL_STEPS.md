# 🚀 Финальные шаги для завершения деплоя

## ✅ Что уже готово:

1. Git репозиторий инициализирован локально
2. Все файлы подготовлены для деплоя
3. Production конфигурация создана

## 📋 Что нужно сделать вручную:

### 1️⃣ Создать GitHub репозиторий и загрузить код

**Вариант А: Через веб-интерфейс (рекомендуется)**

1. Откройте https://github.com/new
2. Repository name: `inventorypro`
3. Description: `IT Equipment Management System`
4. Выберите Private или Public
5. НЕ добавляйте README, .gitignore, license
6. Нажмите "Create repository"

Затем выполните локально:
```bash
cd /Users/rakhat/Documents/webhosting/InventoryPro

# Добавить remote (если еще не добавлен)
git remote add origin https://github.com/rakhatu/inventorypro.git 2>/dev/null || true
git branch -M main

# Push в GitHub
git push -u origin main
```

**При запросе пароля:**
- GitHub не принимает обычные пароли
- Используйте **Personal Access Token**:
  1. Перейдите на https://github.com/settings/tokens
  2. "Generate new token (classic)"
  3. Выберите scope: `repo` (все права для репозиториев)
  4. Сгенерируйте токен
  5. Используйте токен вместо пароля при push

**Вариант Б: Через GitHub CLI (если установлен)**

```bash
gh repo create inventorypro --private --source=. --remote=origin --push
```

### 2️⃣ Развернуть на сервере ams.it-uae.com

**Шаг 1: Подключиться к серверу**

```bash
ssh root@ams.it-uae.com
# Password: hVjrf8Ux
```

**Шаг 2: Загрузить и выполнить скрипт деплоя**

На сервере выполните:

```bash
# Вариант А: Клонировать и запустить скрипт
cd /tmp
curl -o server_deploy.sh https://raw.githubusercontent.com/rakhatu/inventorypro/main/server_deploy.sh
chmod +x server_deploy.sh
bash server_deploy.sh

# ИЛИ Вариант Б: Выполнить команды вручную (см. ниже)
```

**Шаг 2 (альтернатива): Команды вручную**

Если скрипт не работает, выполните команды по порядку:

```bash
# На сервере
cd /var/www

# Очистка
docker ps -aq | xargs -r docker stop 2>/dev/null || true
docker ps -aq | xargs -r docker rm 2>/dev/null || true
docker volume prune -f
rm -rf /var/www/inventorypro

# Клонирование
git clone https://github.com/rakhatu/inventorypro.git
cd inventorypro

# Создание .env
cat > .env << EOF
POSTGRES_PASSWORD=$(openssl rand -hex 16)
SECRET_KEY=$(openssl rand -hex 32)
DEBUG=False
EOF

# Запуск
docker-compose -f docker-compose.prod.yml up -d --build

# Подождать 50 секунд
sleep 50

# Миграции
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head

# Начальные данные
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
"
```

**Шаг 3: Проверка**

```bash
# Проверить статус
docker-compose -f docker-compose.prod.yml ps

# Проверить логи
docker-compose -f docker-compose.prod.yml logs --tail=50

# Проверить доступность
curl http://localhost/health
```

### 3️⃣ Настроить Expo и собрать мобильное приложение

**Шаг 1: Логин в Expo**

```bash
cd /Users/rakhat/Documents/webhosting/InventoryPro/mobile

# Установить EAS CLI
npm install -g eas-cli

# Логин
eas login
# Email: rakhat.utebayev@gmail.com
# Password: ABBYYrah1234
```

**Шаг 2: Настроить проект**

```bash
cd mobile
eas build:configure
```

**Шаг 3: Собрать APK**

```bash
eas build --platform android --profile preview
```

После сборки APK будет доступен на https://expo.dev/accounts/rakhatu/projects/inventorypro/builds

**Шаг 4: Установить на устройство**

1. Перейдите на https://expo.dev/accounts/rakhatu/projects/inventorypro/builds
2. Скачайте APK
3. Установите на Android устройство
4. Откройте приложение
5. Перейдите в Settings → API Configuration
6. Укажите:
   - **Host:** `ams.it-uae.com`
   - **Port:** `80`
7. Сохраните

## 🎉 Готово!

После выполнения всех шагов:

- ✅ **Web:** http://ams.it-uae.com
- ✅ **API:** http://ams.it-uae.com/api/v1
- ✅ **API Docs:** http://ams.it-uae.com/docs
- ✅ **Mobile:** APK на Expo
- ✅ **Login:** admin / admin123

---

**Вопросы?** Смотрите подробные инструкции:
- `COMPLETE_DEPLOYMENT.md` - Полная инструкция
- `SERVER_DEPLOY.md` - Детали деплоя на сервер
- `EXPO_SETUP.md` - Детали настройки Expo

