# Настройка Expo для публикации приложения

## 1. Логин в Expo

```bash
cd mobile
npm install -g eas-cli
eas login
```

Используйте:
- Email: `rakhat.utebayev@gmail.com`
- Password: `ABBYYrah1234`

Или создайте аккаунт на https://expo.dev если его еще нет.

## 2. Настройка проекта

```bash
cd mobile
eas build:configure
```

Это создаст/обновит `eas.json` файл.

## 3. Обновление app.json

Убедитесь, что в `app.json` указаны правильные данные:
- `name`: "InventoryPro"
- `slug`: "inventorypro"
- `bundleIdentifier` (iOS): "com.rakhatu.inventorypro"
- `package` (Android): "com.rakhatu.inventorypro"

## 4. Сборка APK для Android

```bash
cd mobile
eas build --platform android --profile preview
```

После сборки APK будет доступен на https://expo.dev/accounts/rakhatu/

## 5. Сборка для iOS

```bash
cd mobile
eas build --platform ios --profile preview
```

## 6. Установка на устройство

После сборки:
1. Перейдите на https://expo.dev/accounts/rakhatu/
2. Выберите проект `inventorypro`
3. Скачайте APK (Android) или установите через TestFlight (iOS)
4. Установите на устройство

## 7. Настройка API в приложении

После установки:
1. Откройте приложение
2. Перейдите в Settings
3. Укажите:
   - Host: `ams.it-uae.com`
   - Port: `80`
4. Сохраните

## Альтернатива: Development Build

Для разработки можно использовать Expo Go:

```bash
cd mobile
npm start
```

Затем отсканируйте QR код в приложении Expo Go на телефоне.

**Важно:** В настройках Expo Go или приложения укажите API host как `ams.it-uae.com`.

