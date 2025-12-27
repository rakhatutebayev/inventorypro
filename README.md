# InventoryPro
## Production note: avoid HTTPS Mixed Content issues

If you deploy behind Traefik and see `Mixed Content` (HTTPS page → HTTP requests), see:
- `MIXED_CONTENT_TRAEFIK_FASTAPI_VITE.md`


IT Equipment Management System для управления мониторами, ноутбуками и телефонами.

## 🚀 Быстрый старт

### Локальная разработка

```bash
./setup-all.sh
```

Или вручную:
```bash
docker-compose up -d --build
docker-compose exec backend alembic upgrade head
docker-compose exec backend python -c "..." # создание admin
```

### Production деплой

```bash
./deploy.sh
```

Или вручную смотрите [DEPLOY.md](./DEPLOY.md)

## 📱 Мобильное приложение

### Разработка

```bash
cd mobile
npm install
npm start
```

### Публикация на Expo

```bash
cd mobile
eas login
eas build:configure
eas build --platform android
eas build --platform ios
```

После сборки APK/IPA будет доступен на https://expo.dev/accounts/rakhatu/

## 🌐 Доступ

- **Web**: http://ams.it-uae.com (production)
- **API**: http://ams.it-uae.com/api/v1
- **API Docs**: http://ams.it-uae.com/docs

### Данные для входа (default)

- Логин: `admin`
- Пароль: `admin123`

## 📋 Функции

- ✅ Управление активами (Assets)
- ✅ Перемещение между локациями
- ✅ Инвентаризация
- ✅ Печать QR-наклеек
- ✅ Отчеты
- ✅ Управление справочниками
- ✅ Мобильное приложение с QR-сканером

## 🔧 Технологии

- Backend: FastAPI, SQLAlchemy, PostgreSQL
- Frontend: React, TypeScript, Tailwind CSS
- Mobile: React Native, Expo
- Deployment: Docker, Docker Compose, Nginx

## 📝 Документация

- [SETUP.md](./SETUP.md) - Подробная инструкция по настройке
- [DEPLOY.md](./DEPLOY.md) - Инструкция по деплою
- [mobile/MOBILE_README.md](./mobile/MOBILE_README.md) - Документация мобильного приложения
