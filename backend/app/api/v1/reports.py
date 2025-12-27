from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import or_
from io import BytesIO
from pydantic import BaseModel
from app.database import get_db
from app.models.asset import Asset, LocationType
from app.models.employee import Employee
from app.models.warehouse import Warehouse
from app.models.device_type import DeviceType
from app.api.deps import get_current_active_user
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

router = APIRouter()


class ReportRow(BaseModel):
    device_type: str
    vendor_model: str
    serial: str
    inventory: str
    location: str
    phone: str

class ReportDataResponse(BaseModel):
    rows: list[ReportRow]


def get_location_name(db: Session, location_type: LocationType, location_id: int) -> str:
    """Получает название локации (имя сотрудника или название склада)"""
    if location_type == LocationType.employee:
        employee = db.query(Employee).filter(Employee.id == location_id).first()
        return employee.name if employee else f"Employee #{location_id}"
    else:  # warehouse
        warehouse = db.query(Warehouse).filter(Warehouse.id == location_id).first()
        return warehouse.name if warehouse else f"Warehouse #{location_id}"


def get_phone_number(db: Session, location_type: LocationType, location_id: int) -> Optional[str]:
    """Получает телефонный номер (только для сотрудников)"""
    if location_type == LocationType.employee:
        employee = db.query(Employee).filter(Employee.id == location_id).first()
        return employee.phone if employee else None
    return None


@router.get("/data", response_model=ReportDataResponse)
def get_report_data(
    device_type_code: Optional[str] = None,
    employee_id: Optional[int] = None,
    warehouse_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Получение данных отчета в JSON формате для отображения в таблице"""
    # Build query
    query = db.query(Asset)
    
    if device_type_code:
        query = query.filter(Asset.device_type_code == device_type_code)
    
    if employee_id:
        query = query.filter(Asset.location_type == LocationType.employee, Asset.location_id == employee_id)
    
    if warehouse_id:
        query = query.filter(Asset.location_type == LocationType.warehouse, Asset.location_id == warehouse_id)
    
    assets = query.all()
    
    # Get device types for lookup
    device_types = {dt.code: dt.name for dt in db.query(DeviceType).all()}
    
    rows = []
    for asset in assets:
        device_type_name = device_types.get(asset.device_type_code, asset.device_type_code)
        vendor_model = f"{asset.vendor} {asset.model}"
        location_name = get_location_name(db, asset.location_type, asset.location_id)
        phone = get_phone_number(db, asset.location_type, asset.location_id) or ""
        
        rows.append(ReportRow(
            device_type=device_type_name,
            vendor_model=vendor_model,
            serial=asset.serial_number,
            inventory=asset.inventory_number,
            location=location_name,
            phone=phone
        ))
    
    return ReportDataResponse(rows=rows)


@router.get("/export")
def export_report(
    format: str = Query("excel", regex="^(excel|pdf)$"),
    device_type_code: Optional[str] = None,
    employee_id: Optional[int] = None,
    warehouse_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Build query
    query = db.query(Asset)
    
    if device_type_code:
        query = query.filter(Asset.device_type_code == device_type_code)
    
    if employee_id:
        query = query.filter(Asset.location_type == LocationType.employee, Asset.location_id == employee_id)
    
    if warehouse_id:
        query = query.filter(Asset.location_type == LocationType.warehouse, Asset.location_id == warehouse_id)
    
    assets = query.all()
    
    if format == "excel":
        return export_excel(assets, db)
    else:  # pdf
        return export_pdf(assets, db)


def export_excel(assets, db: Session) -> Response:
    """Экспорт в Excel"""
    wb = Workbook()
    ws = wb.active
    ws.title = "Assets Report"
    
    # Headers
    headers = ["Device Type", "Vendor+Model", "Serial", "Inventory", "Location", "Phone"]
    ws.append(headers)
    
    # Style headers
    header_font = Font(bold=True)
    for cell in ws[1]:
        cell.font = header_font
        cell.alignment = Alignment(horizontal='center')
    
    # Get device types for lookup
    device_types = {dt.code: dt.name for dt in db.query(DeviceType).all()}
    
    # Add data
    for asset in assets:
        device_type_name = device_types.get(asset.device_type_code, asset.device_type_code)
        vendor_model = f"{asset.vendor} {asset.model}"
        location_name = get_location_name(db, asset.location_type, asset.location_id)
        phone = get_phone_number(db, asset.location_type, asset.location_id) or ""
        
        ws.append([
            device_type_name,
            vendor_model,
            asset.serial_number,
            asset.inventory_number,
            location_name,
            phone
        ])
    
    # Auto-adjust column widths
    for column in ws.columns:
        max_length = 0
        column_letter = column[0].column_letter
        for cell in column:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except:
                pass
        adjusted_width = min(max_length + 2, 50)
        ws.column_dimensions[column_letter].width = adjusted_width
    
    # Save to BytesIO
    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    
    return Response(
        content=buffer.read(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": "attachment; filename=assets_report.xlsx"
        }
    )


def export_pdf(assets, db: Session) -> Response:
    """Экспорт в PDF"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    
    styles = getSampleStyleSheet()
    
    # Title
    title = Paragraph("Assets Report", styles['Title'])
    elements.append(title)
    elements.append(Paragraph("<br/>", styles['Normal']))
    
    # Prepare data
    data = [["Device Type", "Vendor+Model", "Serial", "Inventory", "Location", "Phone"]]
    
    device_types = {dt.code: dt.name for dt in db.query(DeviceType).all()}
    
    for asset in assets:
        device_type_name = device_types.get(asset.device_type_code, asset.device_type_code)
        vendor_model = f"{asset.vendor} {asset.model}"
        location_name = get_location_name(db, asset.location_type, asset.location_id)
        phone = get_phone_number(db, asset.location_type, asset.location_id) or ""
        
        data.append([
            device_type_name,
            vendor_model[:30],  # Limit length
            asset.serial_number[:20],
            asset.inventory_number,
            location_name[:30],
            phone
        ])
    
    # Create table
    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
    ]))
    
    elements.append(table)
    
    doc.build(elements)
    buffer.seek(0)
    
    return Response(
        content=buffer.read(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=assets_report.pdf"
        }
    )


