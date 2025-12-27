# Полная инструкция по развертыванию InventoryPro

## 📋 Чеклист

- [ ] GitHub репозиторий создан и код загружен
- [ ] Сервер очищен от старого проекта
- [ ] Проект развернут на сервере
- [ ] База данных настроена и заполнена
- [ ] Expo проект настроен
- [ ] Мобильное приложение собрано и готово к установке

## 🔧 Шаг 1: GitHub

### 1.1 Создать репозиторий

1. Откройте https://github.com/new
2. Имя: `inventorypro`
3. Описание: `IT Equipment Management System`
4. Private или Public
5. Создайте репозиторий

### 1.2 Загрузить код

Выполните в терминале на локальном компьютере:

```bash
cd /Users/rakhat/Documents/webhosting/InventoryPro

# Если Git еще не инициализирован
git init
git config user.email "rakhat.utebayev@gmail.com"
git config user.name "rakhatu"

# Добавить файлы
git add .
git commit -m "Initial commit: InventoryPro"

# Добавить remote
git remote add origin https://github.com/rakhatu/inventorypro.git
git branch -M main

# Push (используйте пароль или Personal Access Token)
git push -u origin main
```

**Примечание:** GitHub больше не принимает пароли, используйте Personal Access Token:
1. Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. Выберите scope `repo`
4. Используйте токен вместо пароля

## 🖥️ Шаг 2: Деплой на сервер

### 2.1 Подключение

```bash
ssh root@ams.it-uae.com
# Password: hVjrf8Ux
```

### 2.2 Очистка (выполнить на сервере)

```bash
# Найти и остановить старые контейнеры
docker ps -a
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true

# Удалить старые volumes
docker volume prune -f

# Удалить старую директорию
rm -rf /var/www/inventorypro
```

### 2.3 Клонирование и запуск (выполнить на сервере)

```bash
# Установить Git (если нет)
apt-get update
apt-get install -y git docker.io docker-compose-plugin

# Клонировать проект
mkdir -p /var/www
cd /var/www
git clone https://github.com/rakhatu/inventorypro.git
cd inventorypro

# Создать .env
cat > .env << EOF
POSTGRES_PASSWORD=inventorypro_secure_$(openssl rand -hex 8)
SECRET_KEY=$(openssl rand -hex 32)
DEBUG=False
EOF

# Запустить
docker-compose -f docker-compose.prod.yml up -d --build

# Подождать запуска
sleep 50

# Применить миграции
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head

# Создать данные
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

### 2.4 Проверка

```bash
# Статус контейнеров
docker-compose -f docker-compose.prod.yml ps

# Логи
docker-compose -f docker-compose.prod.yml logs --tail=50

# Проверка доступности
curl http://localhost/health
curl http://ams.it-uae.com/health
```

## 📱 Шаг 3: Настройка Expo

### 3.1 Логин

```bash
cd /Users/rakhat/Documents/webhosting/InventoryPro/mobile
npm install -g eas-cli
eas login
# Email: rakhat.utebayev@gmail.com
# Password: ABBYYrah1234
```

### 3.2 Настройка проекта

```bash
cd mobile
eas build:configure
```

### 3.3 Сборка APK

```bash
eas build --platform android --profile preview
```

После сборки APK будет доступен на https://expo.dev/accounts/rakhatu/

### 3.4 Установка на устройство

1. Перейдите на https://expo.dev/accounts/rakhatu/projects/inventorypro/builds
2. Скачайте APK
3. Установите на Android устройство

### 3.5 Настройка API в приложении

1. Откройте приложение
2. Settings → API Configuration
3. Host: `ams.it-uae.com`
4. Port: `80`
5. Save

## ✅ Готово!

- **Web:** http://ams.it-uae.com
- **API:** http://ams.it-uae.com/api/v1
- **Mobile:** APK доступен на Expo
- **Login:** admin / admin123

