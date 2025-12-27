# 🚀 Быстрый старт - Деплой InventoryPro

## 📋 Краткая инструкция

### 1. GitHub (выполнить локально)

```bash
# Создайте репозиторий на https://github.com/new
# Название: inventorypro

cd /Users/rakhat/Documents/webhosting/InventoryPro
git remote add origin https://github.com/rakhatu/inventorypro.git 2>/dev/null || true
git branch -M main
git push -u origin main
# Используйте Personal Access Token вместо пароля
```

### 2. Сервер (выполнить на сервере)

```bash
# Подключиться
ssh root@ams.it-uae.com
# Password: hVjrf8Ux

# Выполнить деплой
cd /var/www
rm -rf inventorypro
git clone https://github.com/rakhatu/inventorypro.git
cd inventorypro

# Создать .env
cat > .env << EOF
POSTGRES_PASSWORD=$(openssl rand -hex 16)
SECRET_KEY=$(openssl rand -hex 32)
DEBUG=False
EOF

# Запустить
docker-compose -f docker-compose.prod.yml up -d --build
sleep 50
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
docker-compose -f docker-compose.prod.yml exec backend python -c "..." # см. FINAL_STEPS.md
```

### 3. Expo (выполнить локально)

```bash
cd mobile
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```

## 📖 Подробные инструкции

- `FINAL_STEPS.md` - Полная пошаговая инструкция
- `COMPLETE_DEPLOYMENT.md` - Детальная документация
- `SERVER_DEPLOY.md` - Детали деплоя на сервер
- `EXPO_SETUP.md` - Настройка Expo

## 🌐 После деплоя

- Web: http://ams.it-uae.com
- API: http://ams.it-uae.com/api/v1
- Login: admin / admin123

