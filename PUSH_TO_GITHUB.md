# 📤 Загрузка кода в GitHub

## ✅ Код готов к коммиту!

## 📋 Что нужно сделать:

### 1. Создать репозиторий на GitHub (если еще не создан)

1. Откройте: https://github.com/new
2. **Repository name:** `inventorypro`
3. Описание (опционально): `IT Equipment Management System`
4. Выберите **Private** или **Public**
5. **ВАЖНО:** НЕ добавляйте README, .gitignore или license (они уже есть)
6. Нажмите **"Create repository"**

### 2. Загрузить код

Выполните в терминале:

```bash
cd /Users/rakhat/Documents/webhosting/InventoryPro

# Убедитесь, что remote настроен
git remote add origin https://github.com/rakhatu/inventorypro.git

# Проверьте branch
git branch -M main

# Push в GitHub
git push -u origin main
```

### 3. Авторизация

При push GitHub попросит авторизацию. GitHub **не принимает обычные пароли**.

Используйте **Personal Access Token**:

1. Перейдите на: https://github.com/settings/tokens
2. Нажмите **"Generate new token (classic)"**
3. Название: `inventorypro-deploy`
4. Выберите scope: **`repo`** (все права для репозиториев)
5. Нажмите **"Generate token"**
6. **СКОПИРУЙТЕ ТОКЕН** (он показывается только один раз!)
7. При push используйте:
   - **Username:** `rakhatu`
   - **Password:** вставьте скопированный токен

### 4. Альтернатива: GitHub CLI

Если установлен GitHub CLI:

```bash
gh auth login
gh repo create inventorypro --private --source=. --remote=origin --push
```

## ✅ После успешного push

Код будет на GitHub! Затем переходите к деплою на сервер (см. `DEPLOY_NOW.txt`).

