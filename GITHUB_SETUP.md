# Настройка GitHub репозитория

## 1. Создание репозитория на GitHub

1. Перейдите на https://github.com/new
2. Имя репозитория: `inventorypro`
3. Описание: `IT Equipment Management System`
4. Выберите **Private** или **Public**
5. Не добавляйте README, .gitignore, license (они уже есть)
6. Нажмите "Create repository"

## 2. Инициализация Git в проекте

Выполните в терминале:

```bash
cd /Users/rakhat/Documents/webhosting/InventoryPro

# Инициализация Git
git init

# Настройка пользователя
git config user.email "rakhat.utebayev@gmail.com"
git config user.name "rakhatu"

# Добавление всех файлов
git add .

# Первый коммит
git commit -m "Initial commit: InventoryPro IT Equipment Management System"

# Добавление remote репозитория
git remote add origin https://github.com/rakhatu/inventorypro.git

# Push в GitHub
git branch -M main
git push -u origin main
```

При запросе пароля используйте:
- Username: `rakhatu`
- Password: `ABBYYrah1234`

Или используйте Personal Access Token вместо пароля.

## 3. Проверка

После push проверьте на https://github.com/rakhatu/inventorypro что все файлы загружены.

