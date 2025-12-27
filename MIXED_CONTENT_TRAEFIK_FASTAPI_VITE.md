# Mixed Content (HTTPS страница → HTTP запросы): что было и как не допустить в новых проектах

Ниже зафиксированы **2 реальные причины Mixed Content**, которые поймали в продакшене на `ams.it-uae.com`, и **точные исправления**.  
В конце есть **готовые формулировки для новых ТЗ** (требования + критерии приёмки).

## Причина №1: конфликт роутов SPA `/assets` и папки статики Vite `dist/assets`

### Симптомы
- При открытии `https://<домен>/assets` происходят редиректы на `http://<домен>:3000/assets/`
- В консоли браузера: `Mixed Content` (HTTPS страница пытается загрузить HTTP ресурсы)

### Корень проблемы
Vite по умолчанию складывает статику в `dist/assets`.  
Если в приложении есть SPA‑роут **`/assets`**, то внутри контейнера фронта Nginx видит:
- `/usr/share/nginx/html/assets` как **реальную директорию**
- запрос к `/assets` может приводить к редиректу на `/assets/`
- редирект может стать **абсолютным HTTP URL** → Mixed Content

### Исправление
Унести папку статики Vite из `/assets` в другой префикс (например `/static`).

Реализация (Vite):
- `frontend/vite.config.ts` → `build.assetsDir: 'static'`

Ожидаемый результат:
- В `index.html` ссылки на ассеты будут `/static/...`, а не `/assets/...`

## Причина №2: backend (FastAPI/Uvicorn) выдавал редиректы на `http://...` за Traefik

### Симптомы
Фронтенд делает запрос:
- `https://<домен>/api/v1/assets?search=&limit=100` (без слеша в конце)

Backend отвечал:
- `HTTP 307` с заголовком `Location: http://<домен>/api/v1/assets/?...`

Браузер блокирует такой переход как Mixed Content (HTTPS → HTTP).

### Корень проблемы
FastAPI/Starlette генерируют редиректы (например, добавляя trailing slash) исходя из схемы запроса.  
За reverse‑proxy (Traefik) реальная схема приходит в заголовках:
- `X-Forwarded-Proto: https`

Если Uvicorn **не доверяет** proxy‑заголовкам, он считает схему `http` и строит редирект на `http://...`.

### Исправление
Запускать Uvicorn с включёнными proxy‑заголовками:
- `--proxy-headers`
- `--forwarded-allow-ips=*` (или список IP вашего reverse‑proxy)

Реализация (docker-compose):
- `docker-compose.prod.yml` → для `backend` в `command` добавлены флаги `--proxy-headers --forwarded-allow-ips=*`

### Быстрая проверка (после фикса)

Команда:
- `curl -sv 'https://<домен>/api/v1/assets?search=&limit=1' 2>&1 | grep -i location`

Ожидаемо **после фикса**:
- `Location: https://<домен>/api/v1/assets/?...` (только HTTPS)

## Готовые формулировки для новых ТЗ (рекомендуется вставлять как есть)

### Требование 1 (Frontend): запрет конфликта SPA‑роутов со статикой
- **Требование**: “Статические ассеты фронтенда не должны публиковаться под URL‑префиксами, пересекающимися с роутами SPA.”
- **Реализация**: “Для Vite обязательно задавать `build.assetsDir` отличным от `assets` (например `static`).”
- **Критерии приёмки**:
  - `GET https://<домен>/assets` возвращает `200` без редиректа на `http://<домен>:<порт>/...`
  - В HTML/Network ассеты грузятся из `/static/*`, а не `/assets/*`

### Требование 2 (Backend): корректная схема HTTPS за Traefik (proxy headers)
- **Требование**: “Backend за reverse‑proxy обязан корректно определять схему запроса (https) по `X-Forwarded-Proto` и генерировать редиректы только на HTTPS.”
- **Реализация**: “Uvicorn должен быть запущен с `--proxy-headers` и `--forwarded-allow-ips=*` (или списком IP reverse‑proxy).”
- **Критерии приёмки**:
  - `curl -I 'https://<домен>/api/v1/assets?search=&limit=1'` не содержит `Location: http://...`
  - При наличии редиректа (например из‑за trailing slash) `Location` всегда `https://...`

### Требование 3 (Безопасность): отсутствие Mixed Content в продакшене
- **Требование**: “В продакшене запрещены HTTP запросы со страниц, загруженных по HTTPS (Mixed Content).”
- **Критерии приёмки**:
  - В DevTools Console отсутствуют ошибки `Mixed Content`
  - В Network отсутствуют запросы к `http://<домен>/...`


