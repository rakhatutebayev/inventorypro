#!/bin/bash

set -e

echo "🚀 Автоматический деплой InventoryPro"
echo "======================================"
echo ""

# Проверка зависимостей
command -v expect >/dev/null 2>&1 || {
    echo "❌ Требуется expect. Установите: brew install expect (macOS) или apt-get install expect"
    exit 1
}

SERVER="root@ams.it-uae.com"
PASSWORD="hVjrf8Ux"
PROJECT_DIR="/var/www/inventorypro"

# 1. Push в GitHub (если нужно)
echo "1️⃣  Проверка Git репозитория..."
cd "$(dirname "$0")"

if [ -d .git ]; then
    echo "✅ Git репозиторий найден"
    
    # Проверка remote
    if ! git remote get-url origin >/dev/null 2>&1; then
        echo "📤 Добавление remote..."
        git remote add origin https://github.com/rakhatu/inventorypro.git 2>/dev/null || true
    fi
    
    git branch -M main 2>/dev/null || true
    
    echo "📤 Попытка push в GitHub..."
    echo "⚠️  Если потребуется пароль, используйте Personal Access Token"
    git push -u origin main 2>&1 || {
        echo "⚠️  Push не удался. Выполните вручную: git push -u origin main"
    }
else
    echo "⚠️  Git репозиторий не найден"
fi

# 2. Деплой на сервер через expect
echo ""
echo "2️⃣  Подключение к серверу и деплой..."

expect << EOF
set timeout 300
spawn ssh -o StrictHostKeyChecking=no $SERVER

expect {
    "password:" {
        send "$PASSWORD\r"
        exp_continue
    }
    "Permission denied" {
        puts "❌ Ошибка авторизации"
        exit 1
    }
    "# " {
        send "cd /var/www\r"
        expect "# "
        
        send "docker ps -aq | xargs -r docker stop 2>/dev/null || true\r"
        expect "# "
        
        send "docker ps -aq | xargs -r docker rm 2>/dev/null || true\r"
        expect "# "
        
        send "docker volume prune -f 2>/dev/null || true\r"
        expect "# "
        
        send "rm -rf $PROJECT_DIR\r"
        expect "# "
        
        send "command -v git >/dev/null 2>&1 || (apt-get update -qq && apt-get install -y git -qq)\r"
        expect "# "
        
        send "git clone https://github.com/rakhatu/inventorypro.git $PROJECT_DIR 2>&1 || (cd $PROJECT_DIR && git pull)\r"
        expect "# "
        
        send "cd $PROJECT_DIR\r"
        expect "# "
        
        send "cat > .env << 'ENVEOF'\r"
        send "POSTGRES_PASSWORD=\$(openssl rand -hex 16)\r"
        send "SECRET_KEY=\$(openssl rand -hex 32)\r"
        send "DEBUG=False\r"
        send "ENVEOF\r"
        expect "# "
        
        send "docker-compose -f docker-compose.prod.yml up -d --build\r"
        expect "# "
        
        send "sleep 50\r"
        expect "# "
        
        send "docker-compose -f docker-compose.prod.yml exec -T backend alembic upgrade head\r"
        expect "# "
        
        send "docker-compose -f docker-compose.prod.yml exec -T backend python -c 'from app.database import SessionLocal; from app.models.user import User, UserRole; from app.models.company import Company; from app.models.device_type import DeviceType; from app.models.warehouse import Warehouse; from app.models.employee import Employee; from app.core.security import get_password_hash; db = SessionLocal(); db.add(User(username=\"admin\", email=\"admin@example.com\", hashed_password=get_password_hash(\"admin123\"), role=UserRole.admin)) if not db.query(User).filter(User.username == \"admin\").first() else None; db.add(Company(code=\"WWP\", name=\"World Wide Products\")) if not db.query(Company).filter(Company.code == \"WWP\").first() else None; [db.add(DeviceType(code=code, name=name)) for code, name in [(\"01\", \"Monitor\"), (\"02\", \"Laptop\"), (\"03\", \"Phone\")] if not db.query(DeviceType).filter(DeviceType.code == code).first()]; db.add(Warehouse(name=\"Main Warehouse\", address=\"123 Main St\")) if not db.query(Warehouse).filter(Warehouse.name == \"Main Warehouse\").first() else None; db.add(Employee(name=\"John Doe\", phone=\"001\", position=\"Manager\")) if not db.query(Employee).filter(Employee.phone == \"001\").first() else None; db.commit(); print(\"✅ Done\")\r"
        expect "# "
        
        send "docker-compose -f docker-compose.prod.yml ps\r"
        expect "# "
        
        send "exit\r"
        expect eof
    }
}
EOF

echo ""
echo "✅ Деплой завершен!"
echo ""
echo "🌐 Проверьте: http://ams.it-uae.com"
echo "🔐 Логин: admin / admin123"

