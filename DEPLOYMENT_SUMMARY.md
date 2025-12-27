# 🚀 Резюме деплоя InventoryPro

## ✅ Что готово

Все файлы для деплоя на сервер и настройки Expo созданы и готовы к использованию.

## 📋 Быстрый план действий

### 1️⃣ GitHub (локально)

```bash
cd /Users/rakhat/Documents/webhosting/InventoryPro

# Создать репозиторий на GitHub (через веб-интерфейс)
# https://github.com/new
# Название: inventorypro

# Инициализировать Git
git init
git config user.email "rakhat.utebayev@gmail.com"
git config user.name "rakhatu"

# Коммит и push
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/rakhatu/inventorypro.git
git branch -M main
git push -u origin main
```

**Примечание:** Используйте Personal Access Token вместо пароля.

### 2️⃣ Деплой на сервер (ssh на сервер)

```bash
# Подключение
ssh root@ams.it-uae.com
# Password: hVjrf8Ux

# Очистка старых контейнеров
docker ps -a
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true
docker volume prune -f
rm -rf /var/www/inventorypro

# Клонирование
mkdir -p /var/www
cd /var/www
git clone https://github.com/rakhatu/inventorypro.git
cd inventorypro

# Создать .env
cat > .env << EOF
POSTGRES_PASSWORD=$(openssl rand -hex 16)
SECRET_KEY=$(openssl rand -hex 32)
DEBUG=False
EOF

# Запуск
docker-compose -f docker-compose.prod.yml up -d --build

# Миграции и данные (после запуска, через 40 секунд)
sleep 40
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
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

### 3️⃣ Expo (локально)

```bash
cd /Users/rakhat/Documents/webhosting/InventoryPro/mobile

# Логин
npm install -g eas-cli
eas login
# Email: rakhat.utebayev@gmail.com
# Password: ABBYYrah1234

# Настройка
eas build:configure

# Сборка APK
eas build --platform android --profile preview
```

После сборки APK будет на https://expo.dev/accounts/rakhatu/

### 4️⃣ Настройка мобильного приложения

После установки APK:
1. Откройте приложение
2. Settings → API Configuration
3. Host: `ams.it-uae.com`
4. Port: `80`
5. Save

## 🌐 Доступ

- **Web:** http://ams.it-uae.com
- **API:** http://ams.it-uae.com/api/v1
- **API Docs:** http://ams.it-uae.com/docs
- **Mobile:** APK на Expo

## 🔐 Логин

- Username: `admin`
- Password: `admin123`

## 📚 Документация

Подробные инструкции:
- `COMPLETE_DEPLOYMENT.md` - Полная инструкция
- `GITHUB_SETUP.md` - Настройка GitHub
- `SERVER_DEPLOY.md` - Деплой на сервер
- `EXPO_SETUP.md` - Настройка Expo

