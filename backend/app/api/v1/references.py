from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.company import Company
from app.models.device_type import DeviceType
from app.models.warehouse import Warehouse
from app.models.employee import Employee
from app.api.deps import get_current_active_user, require_admin
from pydantic import BaseModel

router = APIRouter()


# Response models
class CompanyResponse(BaseModel):
    id: int
    code: str
    name: str

    class Config:
        from_attributes = True


class DeviceTypeResponse(BaseModel):
    id: int
    code: str
    name: str

    class Config:
        from_attributes = True


class WarehouseResponse(BaseModel):
    id: int
    name: str
    address: Optional[str] = None

    class Config:
        from_attributes = True


class EmployeeResponse(BaseModel):
    id: int
    name: str
    phone: str
    position: Optional[str] = None

    class Config:
        from_attributes = True


# Create/Update models
class CompanyCreate(BaseModel):
    code: str
    name: str


class DeviceTypeCreate(BaseModel):
    code: str
    name: str


class WarehouseCreate(BaseModel):
    name: str
    address: Optional[str] = None


class EmployeeCreate(BaseModel):
    name: str
    phone: str
    position: Optional[str] = None


# Companies
@router.get("/companies", response_model=List[CompanyResponse])
def get_companies(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    companies = db.query(Company).all()
    return companies


@router.post("/companies", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(
    company_in: CompanyCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    if len(company_in.code) != 3 or not company_in.code.isupper():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company code must be exactly 3 uppercase letters"
        )
    if db.query(Company).filter(Company.code == company_in.code).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company code already exists"
        )
    company = Company(code=company_in.code, name=company_in.name)
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


@router.put("/companies/{company_id}", response_model=CompanyResponse)
def update_company(
    company_id: int,
    company_in: CompanyCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    if len(company_in.code) != 3 or not company_in.code.isupper():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company code must be exactly 3 uppercase letters"
        )
    existing = db.query(Company).filter(Company.code == company_in.code, Company.id != company_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company code already exists"
        )
    company.code = company_in.code
    company.name = company_in.name
    db.commit()
    db.refresh(company)
    return company


@router.delete("/companies/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    db.delete(company)
    db.commit()
    return None


# Device Types
@router.get("/device-types", response_model=List[DeviceTypeResponse])
def get_device_types(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    device_types = db.query(DeviceType).all()
    return device_types


@router.post("/device-types", response_model=DeviceTypeResponse, status_code=status.HTTP_201_CREATED)
def create_device_type(
    device_type_in: DeviceTypeCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    if len(device_type_in.code) != 2 or not device_type_in.code.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Device type code must be exactly 2 digits"
        )
    if db.query(DeviceType).filter(DeviceType.code == device_type_in.code).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Device type code already exists"
        )
    device_type = DeviceType(code=device_type_in.code, name=device_type_in.name)
    db.add(device_type)
    db.commit()
    db.refresh(device_type)
    return device_type


@router.put("/device-types/{device_type_id}", response_model=DeviceTypeResponse)
def update_device_type(
    device_type_id: int,
    device_type_in: DeviceTypeCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    device_type = db.query(DeviceType).filter(DeviceType.id == device_type_id).first()
    if not device_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device type not found"
        )
    if len(device_type_in.code) != 2 or not device_type_in.code.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Device type code must be exactly 2 digits"
        )
    existing = db.query(DeviceType).filter(DeviceType.code == device_type_in.code, DeviceType.id != device_type_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Device type code already exists"
        )
    device_type.code = device_type_in.code
    device_type.name = device_type_in.name
    db.commit()
    db.refresh(device_type)
    return device_type


@router.delete("/device-types/{device_type_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_device_type(
    device_type_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    device_type = db.query(DeviceType).filter(DeviceType.id == device_type_id).first()
    if not device_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device type not found"
        )
    db.delete(device_type)
    db.commit()
    return None


# Warehouses
@router.get("/warehouses", response_model=List[WarehouseResponse])
def get_warehouses(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    warehouses = db.query(Warehouse).all()
    return warehouses


@router.post("/warehouses", response_model=WarehouseResponse, status_code=status.HTTP_201_CREATED)
def create_warehouse(
    warehouse_in: WarehouseCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    warehouse = Warehouse(name=warehouse_in.name, address=warehouse_in.address)
    db.add(warehouse)
    db.commit()
    db.refresh(warehouse)
    return warehouse


@router.put("/warehouses/{warehouse_id}", response_model=WarehouseResponse)
def update_warehouse(
    warehouse_id: int,
    warehouse_in: WarehouseCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Warehouse not found"
        )
    warehouse.name = warehouse_in.name
    warehouse.address = warehouse_in.address
    db.commit()
    db.refresh(warehouse)
    return warehouse


@router.delete("/warehouses/{warehouse_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_warehouse(
    warehouse_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Warehouse not found"
        )
    db.delete(warehouse)
    db.commit()
    return None


# Employees
@router.get("/employees", response_model=List[EmployeeResponse])
def get_employees(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    employees = db.query(Employee).all()
    return employees


@router.post("/employees", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    employee_in: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    if db.query(Employee).filter(Employee.phone == employee_in.phone).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee with this phone number already exists"
        )
    employee = Employee(
        name=employee_in.name,
        phone=employee_in.phone,
        position=employee_in.position
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee


@router.put("/employees/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: int,
    employee_in: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    existing = db.query(Employee).filter(Employee.phone == employee_in.phone, Employee.id != employee_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee with this phone number already exists"
        )
    employee.name = employee_in.name
    employee.phone = employee_in.phone
    employee.position = employee_in.position
    db.commit()
    db.refresh(employee)
    return employee


@router.delete("/employees/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    db.delete(employee)
    db.commit()
    return None
