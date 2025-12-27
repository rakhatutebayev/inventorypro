#!/usr/bin/env python3
"""Initialize database with admin user and reference data"""
from app.database import SessionLocal
from app.models.user import User, UserRole
from app.models.company import Company
from app.models.device_type import DeviceType
from app.models.warehouse import Warehouse
from app.models.employee import Employee
from app.core.security import get_password_hash

db = SessionLocal()

try:
    # Create admin user
    if not db.query(User).filter(User.username == 'admin').first():
        admin = User(
            username='admin',
            email='admin@example.com',
            hashed_password=get_password_hash('admin123'),
            role=UserRole.admin
        )
        db.add(admin)
        print('✅ Admin user created')
    else:
        print('ℹ️ Admin user already exists')

    # Create company
    if not db.query(Company).filter(Company.code == 'WWP').first():
        company = Company(code='WWP', name='World Wide Products')
        db.add(company)
        print('✅ Company WWP created')
    else:
        print('ℹ️ Company WWP already exists')

    # Create device types
    device_types = [
        ('01', 'Monitor'),
        ('02', 'Laptop'),
        ('03', 'Phone')
    ]
    for code, name in device_types:
        if not db.query(DeviceType).filter(DeviceType.code == code).first():
            db.add(DeviceType(code=code, name=name))
            print(f'✅ Device type {code} ({name}) created')
        else:
            print(f'ℹ️ Device type {code} already exists')

    # Create warehouse
    if not db.query(Warehouse).filter(Warehouse.name == 'Main Warehouse').first():
        warehouse = Warehouse(name='Main Warehouse', address='123 Main St')
        db.add(warehouse)
        print('✅ Warehouse created')
    else:
        print('ℹ️ Warehouse already exists')

    # Create employee
    if not db.query(Employee).filter(Employee.phone == '001').first():
        employee = Employee(name='John Doe', phone='001', position='Manager')
        db.add(employee)
        print('✅ Employee created')
    else:
        print('ℹ️ Employee already exists')

    db.commit()
    print('✅ All initial data created successfully!')
except Exception as e:
    db.rollback()
    print(f'❌ Error: {e}')
    import traceback
    traceback.print_exc()
finally:
    db.close()

