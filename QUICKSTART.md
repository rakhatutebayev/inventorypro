# Quick Start Guide

## Prerequisites

1. **Docker Desktop** must be installed and running
   - Download from: https://www.docker.com/products/docker-desktop
   - Make sure Docker Desktop is running before proceeding

## Starting the Application

### Option 1: Using the start script (Recommended)

```bash
./start.sh
```

### Option 2: Manual start

1. **Create .env file** (if not exists):
   ```bash
   cp backend/.env.example backend/.env
   # Or create it manually with the content from backend/.env.example
   ```

2. **Start services**:
   ```bash
   docker-compose up -d --build
   ```

3. **Check status**:
   ```bash
   docker-compose ps
   ```

4. **View logs**:
   ```bash
   docker-compose logs -f
   ```

## Initial Setup

After starting the services, you need to:

### 1. Create database migration

```bash
docker-compose exec backend alembic revision --autogenerate -m "Initial migration"
docker-compose exec backend alembic upgrade head
```

### 2. Create initial data

Run this command to create admin user and sample data:

```bash
docker-compose exec backend python -c "
from app.database import SessionLocal
from app.models.user import User, UserRole
from app.models.company import Company
from app.models.device_type import DeviceType
from app.models.warehouse import Warehouse
from app.models.employee import Employee
from app.core.security import get_password_hash

db = SessionLocal()

# Create admin user
admin = User(
    username='admin',
    email='admin@example.com',
    hashed_password=get_password_hash('admin123'),
    role=UserRole.admin
)
db.add(admin)

# Create sample company
company = Company(code='WWP', name='World Wide Products')
db.add(company)

# Create sample device types
device_types = [
    DeviceType(code='01', name='Monitor'),
    DeviceType(code='02', name='Laptop'),
    DeviceType(code='03', name='Phone'),
]
for dt in device_types:
    db.add(dt)

# Create sample warehouse
warehouse = Warehouse(name='Main Warehouse', address='123 Main St')
db.add(warehouse)

# Create sample employee
employee = Employee(name='John Doe', phone='001', position='Manager')
db.add(employee)

db.commit()
print('Initial data created successfully!')
"
```

## Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## Login Credentials

- **Username**: admin
- **Password**: admin123

## Stopping Services

```bash
docker-compose down
```

To also remove volumes (⚠️ will delete database data):
```bash
docker-compose down -v
```

## Troubleshooting

### Docker daemon not running

Make sure Docker Desktop is running. Check with:
```bash
docker ps
```

### Port already in use

If ports 3000, 8000, or 5432 are already in use, stop the conflicting services or change ports in `docker-compose.yml`.

### Database connection errors

Wait a few seconds for PostgreSQL to fully start, then check logs:
```bash
docker-compose logs postgres
```

### Backend not starting

Check backend logs:
```bash
docker-compose logs backend
```

Common issues:
- Missing dependencies: Rebuild with `docker-compose up -d --build`
- Database not ready: Wait a bit longer or check postgres logs


