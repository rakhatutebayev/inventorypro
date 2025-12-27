from sqlalchemy import Column, Integer, String
from app.database import Base


class DeviceType(Base):
    __tablename__ = "device_types"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(2), unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)


