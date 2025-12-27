# ✅ GitHub готов! Следующие шаги

## 🎉 Код успешно загружен в GitHub!

Репозиторий: **https://github.com/rakhatutebayev/inventorypro**

## 📋 Следующий шаг: Деплой на сервер

Теперь нужно развернуть проект на сервере **ams.it-uae.com**

### Быстрый деплой:

1. **Подключитесь к серверу:**
   ```bash
   ssh root@ams.it-uae.com
   # Пароль: hVjrf8Ux
   ```

2. **Выполните команды деплоя:**

   Скопируйте и выполните **ВСЕ команды одним блоком:**

   ```bash
   cd /var/www && rm -rf inventorypro && git clone https://github.com/rakhatutebayev/inventorypro.git && cd inventorypro && cat > .env << 'EOF'
   POSTGRES_PASSWORD=$(openssl rand -hex 16)
   SECRET_KEY=$(openssl rand -hex 32)
   DEBUG=False
   EOF
   docker-compose -f docker-compose.prod.yml up -d --build && sleep 50 && docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head && docker-compose -f docker-compose.prod.yml exec backend python << 'PYEOF'
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
   PYEOF
   ```

3. **Проверьте работу:**
   - Откройте: **http://ams.it-uae.com**
   - Логин: `admin`
   - Пароль: `admin123`

## 📱 После деплоя: Мобильное приложение

После успешного деплоя на сервер можно собрать мобильное приложение:

```bash
cd mobile
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```

APK будет доступен на: https://expo.dev/accounts/rakhatu/

В настройках мобильного приложения укажите:
- Host: `ams.it-uae.com`
- Port: `80`

---

**Подробные инструкции:** `DEPLOY_NOW.txt`

