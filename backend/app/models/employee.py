from sqlalchemy import Column, Integer, String, Enum as SQLEnum
from app.database import Base
import enum


class EmployeeStatus(str, enum.Enum):
    working = "working"
    terminated = "terminated"


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String(3), unique=True, nullable=False, index=True)
    position = Column(String, nullable=True)
    status = Column(SQLEnum(EmployeeStatus, name="employeestatus"), nullable=False, index=True, default=EmployeeStatus.working)


